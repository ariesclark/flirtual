defmodule FlirtualWeb.LayoutView do
  use FlirtualWeb, :view

  # Phoenix LiveDashboard is available only in development by default,
  # so we instruct Elixir to not warn if the dashboard route is missing.
  @compile {:no_warn_undefined, {Routes, :live_dashboard_path, 2}}

  import FlirtualWeb.Components.Header
  import FlirtualWeb.Components.Footer

end
