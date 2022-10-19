# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :flirtual,
  ecto_repos: [Flirtual.Repo]

# Configures the endpoint
config :flirtual, FlirtualWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: FlirtualWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: Flirtual.PubSub,
  live_view: [signing_salt: "***REMOVED***/"]

config :flirtual, Flirtual.Elasticsearch,
  url: "https://***REMOVED***",
  default_headers: [
    {"authorization", "ApiKey ***REMOVED***"}
  ],
  api: Elasticsearch.API.HTTP,
  json_library: Jason

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :flirtual, Flirtual.Mailer, adapter: Swoosh.Adapters.Local

# Swoosh API client is needed for adapters other than SMTP.
config :swoosh, :api_client, false

config :esbuild,
  version: "0.14.0",
  default: [
    args:
      List.flatten([
        Path.wildcard("assets/js/**/*.ts")
        |> Enum.map(&Path.relative_to(&1, "assets")),
        "--bundle",
        "--minify",
        "--splitting",
        "--chunk-names=chunks/[hash]",
        "--outdir=../priv/static/assets",
        "--format=esm",
        "--external:/fonts/*",
        "--external:/images/*"
      ]),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "3.1.6",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
