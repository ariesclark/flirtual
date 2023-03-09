defmodule FlirtualWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :flirtual

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :flirtual
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug CORSPlug,
    origin: [
      "https://next.flirtu.al"
    ]

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head

  plug Plug.Session,
    store: :cookie,
    same_site: "Lax",
    key: "session",
    signing_salt: {FlirtualWeb.Endpoint, :session_signing_salt}

  plug FlirtualWeb.Router
end
