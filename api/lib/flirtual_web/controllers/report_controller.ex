defmodule FlirtualWeb.ReportController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Report, Policy}

  action_fallback FlirtualWeb.FallbackController

  def list(conn, params) do
    with reports <- Report.list(params) do
      conn |> json(reports |> Enum.filter(&Policy.can?(conn, :read, &1)))
    end
  end

  def create(conn, params) do
    params = Map.put(params, "user_id", conn.assigns[:session].user.id)

    with {:ok, report} <- Report.create(params) do
      conn |> json(Policy.transform(conn, report))
    end
  end

  def delete(conn, %{"report_id" => report_id}) do
    with %Report{} = report <- Report.get(report_id),
         :ok <- Policy.can(conn, :delete, report),
         {:ok, report} <- Report.clear(report) do
      conn |> json(Policy.transform(conn, report))
    else
      nil -> {:error, {:not_found, "Report not found"}}
      value -> value
    end
  end

  def delete(conn, %{"user_id" => user_id} = params) do
    with reports <-
           Report.list(target_id: user_id)
           |> Enum.filter(&Policy.can?(conn, :delete, &1)),
         {:ok, count} <- Report.clear_all(reports) do
      conn |> json(%{count: count})
    end
  end
end
