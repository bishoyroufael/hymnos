import { useState } from "react";
import { FiPlay, FiClock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { usePGlite } from "@electric-sql/pglite-react";

interface QueryResult {
  rows: any[];
  fields: { name: string; dataTypeID: number }[];
  affectedRows?: number;
  time: number;
}

interface QueryExecution {
  query: string;
  result?: QueryResult;
  error?: string;
  timestamp: Date;
}

const DEFAULT_QUERIES = {
  "Test Book Tree": `SELECT get_book_tree((SELECT id FROM content WHERE type = 'book' LIMIT 1));`,
  "Test Book Nodes": `SELECT * FROM book_node LIMIT 5;`,
  "Count Books": `SELECT COUNT(*) FROM book;`,
  "Count Book Nodes": `SELECT COUNT(*) FROM book_node;`,
  "Count Slides": `SELECT COUNT(*) FROM slide WHERE content_id IN (SELECT id FROM book_node);`,
  "All Tables": `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`,
  "Explain Book Tree": `EXPLAIN ANALYZE SELECT get_book_tree((SELECT id FROM content WHERE type = 'book' LIMIT 1));`,
};

export default function SQLTestPage() {
  const db = usePGlite();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<QueryExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeQuery = async (sqlQuery: string) => {
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    const startTime = performance.now();

    try {
      const result = await db.query(sqlQuery);
      const endTime = performance.now();

      const execution: QueryExecution = {
        query: sqlQuery,
        result: {
          rows: result.rows,
          fields: result.fields,
          affectedRows: result.affectedRows,
          time: endTime - startTime,
        },
        timestamp: new Date(),
      };

      setHistory([execution, ...history]);
    } catch (error) {
      const endTime = performance.now();
      const execution: QueryExecution = {
        query: sqlQuery,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };

      setHistory([execution, ...history]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(query);
  };

  const loadDefaultQuery = (queryName: string) => {
    setQuery(DEFAULT_QUERIES[queryName as keyof typeof DEFAULT_QUERIES]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const formatValue = (value: any): string => {
    // If it's already an object, stringify it
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 4);
    }

    // If it's a string that looks like JSON, try to parse and pretty-print
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 4);
      } catch {
        // Not JSON, return as-is
        return String(value);
      }
    }

    // For other primitives, just convert to string
    return String(value);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4" dir="ltr">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-warning text-warning-content p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            <h1 className="text-xl font-bold">SQL Query Tester (DEV MODE ONLY)</h1>
          </div>
          <p className="text-sm mt-1">This page is only available in development mode</p>
        </div>

        {/* Default Queries */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">Quick Queries</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DEFAULT_QUERIES).map((queryName) => (
                <button key={queryName} className="btn btn-sm btn-outline" onClick={() => loadDefaultQuery(queryName)}>
                  {queryName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Query Input */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">Query Editor</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea className="textarea textarea-bordered font-mono text-sm h-40 w-full" placeholder="Enter your SQL query here..." value={query} onChange={(e) => setQuery(e.target.value)} disabled={isExecuting} />
              <div className="flex gap-2">
                <button type="submit" className={`btn btn-primary ${isExecuting ? "loading" : ""}`} disabled={isExecuting || !query.trim()}>
                  <FiPlay className="w-4 h-4" />
                  Execute Query
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setQuery("")} disabled={isExecuting}>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Query History</h2>
              {history.length > 0 && (
                <button className="btn btn-sm btn-ghost" onClick={clearHistory}>
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-base-content/50 text-center py-8">No queries executed yet</p>
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((execution, index) => (
                  <div key={index} className="border border-base-300 rounded-lg p-4">
                    {/* Query Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-mono text-sm bg-base-200 p-2 rounded flex-1 mr-4">{execution.query}</div>
                      <div className="text-xs text-base-content/50">{execution.timestamp.toLocaleTimeString()}</div>
                    </div>

                    {/* Result or Error */}
                    {execution.error ? (
                      <div className="alert alert-error">
                        <FiAlertCircle className="w-5 h-5" />
                        <div>
                          <h3 className="font-bold">Error</h3>
                          <div className="text-xs">{execution.error}</div>
                        </div>
                      </div>
                    ) : execution.result ? (
                      <div>
                        {/* Stats */}
                        <div className="flex gap-4 mb-2 text-sm">
                          <div className="flex items-center gap-1 text-success">
                            <FiCheckCircle className="w-4 h-4" />
                            <span>{execution.result.rows.length} rows</span>
                          </div>
                          <div className="flex items-center gap-1 text-info">
                            <FiClock className="w-4 h-4" />
                            <span>{execution.result.time.toFixed(2)}ms</span>
                          </div>
                        </div>

                        {/* Results Table */}
                        {execution.result.rows.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="table table-zebra table-sm text-start">
                              <thead>
                                <tr>
                                  {execution.result.fields.map((field) => (
                                    <th key={field.name}>{field.name}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {execution.result.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {execution.result!.fields.map((field) => (
                                      <td key={field.name} className="font-mono text-xs whitespace-pre-wrap">
                                        {formatValue(row[field.name])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-base-content/50 text-sm">No rows returned</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
