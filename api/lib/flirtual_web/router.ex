defmodule FlirtualWeb.Router do
  use FlirtualWeb, :router

  import Phoenix.Router
  import Plug.Conn

  import FlirtualWeb.SessionController

  @internal_api_key "***REMOVED***"

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {FlirtualWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :fetch_current_session
  end

  def require_internal_authorization(conn, _opts) do
    if List.first(Plug.Conn.get_req_header(conn, "api-key")) === @internal_api_key do
      conn
    else
      conn
      |> resp(:forbidden, "")
      |> halt()
    end
  end

  scope "/", FlirtualWeb do
    pipe_through :api

    scope "/v1/" do
      scope "/auth" do
        scope "/session" do
          post "/", SessionController, :create

          scope "/" do
            pipe_through :require_authenticated_user

            get "/", SessionController, :get
            delete "/", SessionController, :delete
          end
        end

        scope "/user" do
          pipe_through :require_authenticated_user

          get "/", UsersController, :get_current_user
        end

        scope "/connect/:connection_type" do
          pipe_through :require_authenticated_user

          get "/authorize", UsersController, :start_connection
          get "/", UsersController, :assign_connection
        end
      end

      scope "/users" do
        post "/", UsersController, :create

        scope "/:username/username" do
          pipe_through :require_authenticated_user

          get "/", UsersController, :get
        end

        scope "/:user_id" do
          pipe_through :require_authenticated_user

          get "/", UsersController, :get
          post "/", UsersController, :update

          post "/email", UsersController, :update_email
          post "/email/confirm", UsersController, :confirm_email

          get "/connections", UsersController, :list_connections

          scope "/preferences" do
            post "/privacy", UsersController, :update_privacy_preferences
          end

          scope "/profile" do
            post "/", ProfileController, :update

            scope "/personality" do
              get "/", ProfileController, :get_personality
              post "/", ProfileController, :update_personality
            end

            scope "/images" do
              post "/", ProfileController, :update_images
              put "/", ProfileController, :create_images
            end

            scope "/preferences" do
              post "/", ProfileController, :update_preferences
            end
          end
        end
      end

      scope "/attributes" do
        scope "/:attribute_type" do
          get "/", AttributeController, :list
        end
      end

      scope "/internal" do
        pipe_through :require_internal_authorization

        post "/seed", MatchmakingController, :seed

        scope "/user/:id" do
          post "/", MatchmakingController, :update
          get "/matches", MatchmakingController, :compute
          post "/like/:target_id", MatchmakingController, :like
          post "/pass/:target_id", MatchmakingController, :pass
          post "/block/:target_id", MatchmakingController, :block
        end
      end
    end
  end

  if Mix.env() == :dev do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
      live_dashboard "/dashboard", metrics: FlirtualWeb.Telemetry
    end
  end

  match :*, "/*any", FlirtualWeb.FallbackController, :not_found
end
