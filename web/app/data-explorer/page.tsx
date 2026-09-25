"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { data as analytics, fmtINR, fmtNum, fmtPct } from "@/lib/data";

type Meta = {
  categorical: Record<string, string[]>;
  ageRange: { min: number; max: number };
  totalRows: number;
};

type ExploreResponse = {
  matched_rows: number;
  total_rows: number;
  summary: {
    sessions: number;
    unique_customers: number;
    orders: number;
    conversion_rate: number;
    revenue: number;
    aov: number;
    return_rate: number;
  };
  sample: Record<string, string | number | boolean>[];
  stat: {
    column: string;
    n: number;
    mean: number;
    median: number;
    std: number;
    variance: number;
    min: number;
    max: number;
    range: number;
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
    outlier_lower_bound: number;
    outlier_upper_bound: number;
    n_outliers: number;
  } | null;
  histogram: { bin_start: number; bin_end: number; count: number }[] | null;
};

const FILTER_FIELDS: { key: string; label: string }[] = [
  { key: "customer_segment", label: "Customer Segment" },
  { key: "income_level", label: "Income Level" },
  { key: "device", label: "Device" },
  { key: "acquisition_channel", label: "Acquisition Channel" },
  { key: "category", label: "Category" },
  { key: "city_tier", label: "City Tier" },
  { key: "gender", label: "Gender" },
  { key: "season", label: "Season" },
];

const BOOLEAN_FIELDS: { key: string; label: string }[] = [
  { key: "purchase", label: "Purchase" },
  { key: "returned", label: "Returned" },
  { key: "add_to_cart", label: "Add to Cart" },
  { key: "discount_exposed", label: "Discount Exposed" },
];

const STAT_COLUMNS = [
  "order_value", "customer_age", "session_duration_min", "pages_viewed",
  "products_viewed", "searches", "cart_items", "engagement_score",
  "customer_total_spend", "estimated_delivery_days",
];

export default function DataExplorerPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [statCol, setStatCol] = useState("order_value");
  const [result, setResult] = useState<ExploreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  useEffect(() => {
    fetch("/api/explore/meta")
      .then((r) => r.json())
      .then(setMeta);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v && v !== "all") params.set(k, v);
    }
    if (ageMin) params.set("age_min", ageMin);
    if (ageMax) params.set("age_max", ageMax);
    if (statCol) params.set("stat_col", statCol);
    params.set("limit", "25");

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-loading indicator
    setLoading(true);
    fetch(`/api/explore?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setResult(d);
        setLoading(false);
      });
  }, [filters, ageMin, ageMax, statCol]);

  const histogramData = useMemo(() => {
    if (!result?.histogram) return [];
    return result.histogram.map((b) => ({
      name: `${fmtNum(b.bin_start, 0)}–${fmtNum(b.bin_end, 0)}`,
      value: b.count,
    }));
  }, [result]);

  const filteredColumns = useMemo(() => {
    if (!columnSearch) return analytics.dataset_meta.columns;
    return analytics.dataset_meta.columns.filter((c) =>
      c.toLowerCase().includes(columnSearch.toLowerCase())
    );
  }, [columnSearch]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Query the dataset"
        title="Data Explorer"
        description={`Filter and aggregate all ${fmtNum(analytics.dataset_meta.n_rows, 0)} sessions server-side. The full dataset never reaches your browser — every result below is a live aggregate computed on the server for the filters you choose.`}
      />

      {/* Column search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Columns</CardTitle>
          <CardDescription>
            {analytics.dataset_meta.n_columns} columns available. Search to find a field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search column names…"
            value={columnSearch}
            onChange={(e) => setColumnSearch(e.target.value)}
            className="mb-3 max-w-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {filteredColumns.map((c) => (
              <Badge key={c} variant="secondary" className="font-mono text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Rows</CardTitle>
          <CardDescription>Every control below re-queries the server. Results update live.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {FILTER_FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="mb-1.5 block text-xs text-muted-foreground">{f.label}</Label>
                <Select
                  value={filters[f.key] ?? "all"}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v ?? "all" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {meta?.categorical[f.key]?.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {BOOLEAN_FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="mb-1.5 block text-xs text-muted-foreground">{f.label}</Label>
                <Select
                  value={filters[f.key] ?? "all"}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v ?? "all" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Age min {meta ? `(${meta.ageRange.min})` : ""}
              </Label>
              <Input
                type="number"
                placeholder={meta ? String(meta.ageRange.min) : ""}
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Age max {meta ? `(${meta.ageRange.max})` : ""}
              </Label>
              <Input
                type="number"
                placeholder={meta ? String(meta.ageRange.max) : ""}
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Matched {result ? fmtNum(result.matched_rows, 0) : "…"} of{" "}
            {result ? fmtNum(result.total_rows, 0) : fmtNum(analytics.dataset_meta.n_rows, 0)} sessions
          </h2>
          {loading && <span className="text-xs text-muted-foreground">Updating…</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Sessions" value={result ? fmtNum(result.summary.sessions, 0) : "–"} />
          <StatCard label="Unique Customers" value={result ? fmtNum(result.summary.unique_customers, 0) : "–"} />
          <StatCard
            label="Conversion Rate"
            value={result ? fmtPct(result.summary.conversion_rate) : "–"}
            accent="var(--series-1)"
          />
          <StatCard label="Revenue" value={result ? fmtINR(result.summary.revenue) : "–"} accent="var(--status-good)" />
          <StatCard label="Return Rate" value={result ? fmtPct(result.summary.return_rate) : "–"} accent="var(--status-serious)" />
        </div>
      </section>

      {/* Variable distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select a Variable to See Its Distribution</CardTitle>
          <CardDescription>Summary statistics and a histogram, computed server-side over the current filter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-xs">
            <Select value={statCol} onValueChange={(v) => v && setStatCol(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAT_COLUMNS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result?.stat && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3 md:grid-cols-6">
                <StatCard label="N" value={fmtNum(result.stat.n, 0)} />
                <StatCard label="Mean" value={fmtNum(result.stat.mean, 2)} />
                <StatCard label="Median" value={fmtNum(result.stat.median, 2)} />
                <StatCard label="Std Dev" value={fmtNum(result.stat.std, 2)} />
                <StatCard label="IQR" value={fmtNum(result.stat.iqr, 2)} />
                <StatCard label="Outliers" value={fmtNum(result.stat.n_outliers, 0)} sublabel={`beyond [${fmtNum(result.stat.outlier_lower_bound, 0)}, ${fmtNum(result.stat.outlier_upper_bound, 0)}]`} />
              </div>
              <BarChartCard data={histogramData} valueFormatter={(v) => fmtNum(v, 0)} color="var(--series-1)" showValues={false} />
              <p className="mt-2 text-xs text-muted-foreground">
                Binned from min to the 95th percentile (16 bins); the final bar folds in the long right tail so
                skewed fields like order value stay legible.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Row preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Row Preview</CardTitle>
          <CardDescription>First 25 matching sessions (of {result ? fmtNum(result.matched_rows, 0) : "–"} matched) &mdash; not the full result set.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {result?.sample[0] &&
                  Object.keys(result.sample[0]).map((k) => (
                    <TableHead key={k} className="whitespace-nowrap font-mono text-xs">
                      {k}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result?.sample.map((row, i) => (
                <TableRow key={i}>
                  {Object.values(row).map((v, j) => (
                    <TableCell key={j} className="whitespace-nowrap text-xs">
                      {String(v)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
