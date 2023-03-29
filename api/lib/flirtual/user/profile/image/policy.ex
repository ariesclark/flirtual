defmodule Flirtual.User.Profile.Image.Policy do
  use Flirtual.Policy

  alias Flirtual.User.Session
  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Image

  # Any user can view any images.
  def authorize(:read, _, _), do: true

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  def transform(
        :url,
        _,
        %Image{} = image
      ),
      do: "https://media.flirtu.al/" <> image.external_id <> "/"

  def transform(
        :scanned,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              user: user
            }
          }
        },
        %Image{} = image
      ) do
    if :admin in user.tags, do: image.scanned, else: nil
  end

  # Otherwise, by default, nobody can see if this image was scanned or not.
  def transform(:scanned, _, _), do: nil

  def transform(
        property,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Image{
          profile: %Profile{
            user: %User{
              id: user_id
            }
          }
        } = image
      )
      when property in [:created_at, :updated_at],
      do: image[property]

  def transform(
        property,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              user: user
            }
          }
        },
        %Image{} = image
      )
      when property in [:created_at, :updated_at],
      do: if(:moderator in user.tags, do: image[property], else: nil)

  def transform(:updated_at, _, _), do: nil
  def transform(:created_at, _, _), do: nil
end
