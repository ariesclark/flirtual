defmodule FlirtualWeb.ConnectionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities

  alias Flirtual.Connection
  alias Flirtual.Repo
  alias Flirtual.User
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  defp assign_state(conn, state) do
    conn |> put_session(:state, state)
  end

  defp validate_state(conn, state) do
    if get_session(conn, :state) !== state do
      {:error, {:bad_request, "State mismatch"}}
    else
      {:ok, conn}
    end
  end

  def list_available(conn, _) do
    conn
    |> json(Connection.list_available(conn.assigns[:session].user))
  end

  def authorize(conn, %{"type" => type, "next" => next}) do
    type = to_atom(type)

    state =
      :crypto.strong_rand_bytes(8)
      |> Base.encode16(case: :lower)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, authorize_url} <- provider.authorize_url(conn, %{state: state}) do
      conn
      |> assign_state(state)
      |> put_session(:next, next)
      |> redirect(external: authorize_url |> URI.to_string())
    else
      {:error, :provider_not_found} ->
        {:error, {:not_found, "Provider not found", %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, "Authorize not supported", %{type: type}}}

      reason ->
        reason
    end
  end

  def delete(conn, %{"type" => type, "next" => next}) do
    type = to_atom(type)

    with :ok <- Connection.delete(conn.assigns[:session].user.id, type) do
      conn |> redirect(external: next)
    end
  end

  defp grant_next(conn, next \\ nil) do
    next = if(next, do: next, else: get_session(conn, :next))

    conn
    |> delete_session(:state)
    |> delete_session(:next)
    |> redirect(external: next)
  end

  defp grant_error(conn, message) do
    redirect(conn,
      external:
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge(get_session(conn, :next) <> "?error=" <> message)
        |> URI.to_string()
    )
  end

  def grant(conn, %{"type" => type, "code" => code, "state" => state}) do
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, conn} <- validate_state(conn, state),
         {:ok, authorization} <- provider.exchange_code(code),
         {:ok, profile} <- provider.get_profile(authorization),
         connection <- Connection.get(uid: profile.uid, type: type) do
      user = conn.assigns[:session] && conn.assigns[:session].user

      case {user, connection} do
        {%User{} = user, nil} ->
          %Connection{}
          |> Connection.changeset(profile)
          |> change(%{user_id: user.id, type: type})
          |> Repo.insert!()

          # remove legacy connections
          if type == :discord do
            user.profile
            |> change(%{
              discord: nil
            })
            |> Repo.update()
          end

          grant_next(conn)

        {%User{} = user, %Connection{user: %User{id: user_id}}} when user_id == user.id ->
          grant_next(conn)

        {%User{} = user, %Connection{user: %User{id: user_id}}} when user_id != user.id ->
          grant_error(
            conn,
            "This #{Connection.provider_name!(type)} account is already connected to a different Flirtual account."
          )

        {nil, %Connection{user: %User{banned_at: nil} = login_user}} ->
          next = get_session(conn, :next)
          {_, conn} = SessionController.create(conn, login_user)
          grant_next(conn, next)

        {nil, %Connection{user: %User{}}} ->
          grant_error(conn, "Your account has been banned; check your email for details")

        {nil, nil} ->
          grant_error(
            conn,
            "No Flirtual account found for this #{Connection.provider_name!(type)} user."
          )
      end
    else
      {:error, :unverified_email} ->
        grant_error(
          conn,
          "Please verify your email with #{Connection.provider_name!(type)} and try again."
        )

      {:error, :provider_not_found} ->
        grant_error(conn, "Provider not found.")

      {:error, :not_supported} ->
        grant_error(conn, "Grant not supported.")

      {:error, :invalid_grant} ->
        grant_error(conn, "Invalid grant.")

      {:error, :upstream} ->
        grant_error(conn, "Upstream error.")

      _ ->
        grant_error(conn, "Internal Server Error.")
    end
  end
end
