import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type TestRow = {
  id: number;
  created_at: string;
};

const TestTablePage: React.FC = () => {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all rows
  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("test_table")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setError("Failed to fetch rows.");
    } else {
      // supabase can send bigint as string depending on driver
      const normalized = (data ?? []).map((row: TestRow) => ({
        id: Number(row.id),
        created_at: row.created_at,
      }));
      setRows(normalized);
    }
    setLoading(false);
  };

  // Insert a new row
  const createRow = async () => {
    setCreating(true);
    setError(null);

    // no payload needed if defaults handle id / created_at
    const { error } = await supabase.from("test_table").insert({});
    if (error) {
      console.error(error);
      setError("Failed to create row.");
    } else {
      await fetchRows();
    }
    setCreating(false);
  };

  // Delete by id
  const deleteRow = async (id: number) => {
    setError(null);
    const { error } = await supabase
      .from("test_table")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
        setError("Failed to delete row.");
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  return (
    <section className="min-h-dvh w-full bg-gradient-to-br from-green-200 via-amber-100 to-amber-300 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">
              test_table Admin
            </h1>
            <p className="text-sm text-gray-600">
              Global list (not per-user). Create and delete rows.
            </p>
          </div>

          <button
            onClick={createRow}
            disabled={creating}
            className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "➕ Create Row"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-rose-100 text-rose-800 text-sm px-3 py-2 border border-rose-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_auto] px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
            <div>ID</div>
            <div>Created At</div>
            <div className="text-center">Actions</div>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-gray-600 text-sm">
              Loading...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 text-sm">
              No rows yet. Hit “Create Row”.
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_2fr_auto] px-4 py-4 text-sm items-center border-b last:border-b-0 border-gray-100"
              >
                <div className="font-mono text-gray-800">{row.id}</div>
                <div className="text-gray-700 font-mono text-xs">
                  {new Date(row.created_at).toLocaleString()}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 hover:text-rose-800 shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={fetchRows}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-gray-300 shadow hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestTablePage;
