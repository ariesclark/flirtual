defmodule Flirtual.Attribute do
  use Flirtual.Schema

  import Flirtual.Utilities.Changeset
  import Flirtual.Utilities
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Attribute, Repo}

  alias Flirtual.Languages
  alias Flirtual.Countries

  @derive {Inspect, only: [:id, :type, :metadata]}

  schema "attributes" do
    field :type, :string
    field :name, :string
    field :metadata, :map

    timestamps(inserted_at: false)
  end

  def by_id(attribute_id) do
    Attribute
    |> where(id: ^attribute_id)
    |> Repo.one()
  end

  def by_id_explicit(attribute_id, type) do
    IO.inspect([attribute_id, type])

    Attribute
    |> where(id: ^attribute_id, type: ^type)
    |> Repo.one()
  end

  def exists_id_explicit?(attribute_id, type) do
    Attribute
    |> where(id: ^attribute_id, type: ^type)
    |> Repo.exists?()
  end

  def by_ids(attribute_ids, type) do
    if length(attribute_ids) === 0 do
      []
    else
      Attribute
      |> where([attribute], attribute.id in ^attribute_ids and attribute.type == ^type)
      |> Repo.all()
    end
  end

  def by_ids(attribute_ids) do
    if length(attribute_ids) === 0 do
      []
    else
      Attribute
      |> where([attribute], attribute.id in ^attribute_ids)
      |> Repo.all()
    end
  end

  def by_type("country") do
    Countries.list()
    |> Enum.map(
      &%Attribute{
        id: &1[:iso_3166_1],
        type: "country",
        name: &1[:name],
        metadata: %{
          "flag_url" =>
            "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/" <>
              &1[:iso_3166_1] <> ".svg"
        }
      }
    )
  end

  def by_type("language") do
    Languages.list()
    |> Enum.map(
      &%Attribute{
        id: &1[:iso_639_1],
        type: "language",
        name: &1[:name]
      }
    )
  end

  def by_type(attribute_type) do
    Attribute
    |> where(type: ^attribute_type)
    |> Repo.all()
  end

  def validate_attribute(changeset, id_key, attribute_type, options \\ []) do
    key =
      Keyword.get(
        options,
        :key,
        id_key
        |> Atom.to_string()
        |> String.replace_suffix("_id", "")
        |> to_atom()
      )

    changeset
    |> validate_uuid(id_key)
    |> then(fn changeset ->
      if not changeset.valid? or not changed?(changeset, id_key) do
        changeset
      else
        value = get_field(changeset, id_key)
        IO.inspect([value, id_key])
        attribute = by_id_explicit(value, attribute_type)

        if is_nil(attribute) do
          changeset
          |> add_error(id_key, "does not exist")
        else
          changeset
          |> put_change(key, attribute)
        end
      end
    end)
  end

  def validate_attribute_list(changeset, ids, types, changeset_fn \\ & &1, options \\ []) do
    required_attributes = Keyword.get(options, :required, [])
    field_name = Keyword.get(options, :field, :attributes)

    cast_arbitrary(
      types
      |> Enum.map(&{&1, {:array, :map}})
      |> Map.new(fn {k, v} -> {k, v} end)
      |> Map.put(:_, {:array, :string}),
      %{_: if(is_nil(ids), do: get_field(changeset, field_name) |> Enum.map(& &1.id), else: ids)}
    )
    |> validate_uuids(:_)
    |> then(fn changeset ->
      if not changeset.valid? do
        changeset
      else
        cast(
          changeset,
          get_field(changeset, :_, [])
          |> Attribute.by_ids()
          |> Enum.group_by(& &1.type),
          types
        )
        |> delete_change(:_)
        |> validate_required(required_attributes)
        |> changeset_fn.()
      end
    end)
    |> then(
      &(append_changeset_errors(changeset, &1)
        |> put_assoc(
          field_name,
          Enum.map(types, fn type ->
            get_field(&1, type, [])
          end)
          |> List.flatten()
        ))
    )
  end
end

defimpl Jason.Encoder, for: Flirtual.Attribute do
  use Flirtual.Encoder,
    only: [
      :id,
      :type,
      :name,
      :metadata
    ]
end
