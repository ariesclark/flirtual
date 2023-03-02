defmodule Flirtual.Elastic do
  use Elasticsearch.Cluster, otp_app: :flirtual

  def search(index, query) do
    Elasticsearch.post(Flirtual.Elastic, "/" <> index <> "/_search", query)
  end

  def recreate_index() do
    Elasticsearch.delete(Flirtual.Elastic, "/users")

    Elasticsearch.Index.create_from_file(
      Flirtual.Elastic,
      "users",
      "priv/elasticsearch/users.json"
    )
  end

  def bulk_changes_body(changes) do
    (changes
     |> Enum.map(fn {type, id, document} ->
       [
         Map.put(%{}, type, %{"_id" => id}),
         case type do
           type when type in [:create, :index] -> document
           :update -> %{doc: document}
           :delete -> nil
         end
       ]
       |> Enum.filter(&(not is_nil(&1)))
     end)
     |> List.flatten()
     |> Enum.map(&Jason.encode!(&1))
     |> Enum.join("\n")) <> "\n"
  end

  def bulk_changes(index, changes, limit \\ 100) do
    IO.inspect(changes)

    changes
    |> Enum.chunk_every(limit)
    |> Enum.each(fn changes ->
      changes
      |> bulk_changes_body()
      |> then(fn body ->
        resp =
          Elasticsearch.post!(
            Flirtual.Elastic,
            "/" <> index <> "/_bulk",
            body
          )

        if resp["errors"] do
          resp["items"]
          |> Enum.find(fn item ->
            inner_item = Map.keys(item) |> List.first()
            !!inner_item["error"]
          end)
          |> then(&{:error, Elasticsearch.Exception.exception(&1)})
        end
      end)
    end)
  end

  def get_document(index, id) do
    with {:ok, document} <- Elasticsearch.get(Flirtual.Elastic, "/" <> index <> "/_doc/#{id}") do
      {:ok, document["_source"]}
    end
  end
end
