import useSWR from "swr";

interface FetchSheetDataOptions {
  worksheet: string;
  machine?: string;
  status?: string;
  range?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  const data = await res.json();
  return data.data;
};

export function useSheetData(options: FetchSheetDataOptions) {
  const params = new URLSearchParams();
  params.append("worksheet", options.worksheet);
  if (options.machine) {
    params.append("machine", options.machine);
  }
  if (options.status) {
    params.append("status", options.status);
  }
  if (options.range) {
    params.append("range", options.range);
  }

  console.log(params.toString());

  const url = `/api/sheets?${params.toString()}`;

  const { data, error, isLoading } = useSWR(url, fetcher);

  return {
    data,
    isLoading,
    isError: error,
  };
}
