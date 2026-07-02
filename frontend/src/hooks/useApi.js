import { useEffect, useRef, useState } from "react";

// Runs `fetcher` whenever `deps` change and exposes { data, loading, error }.
// `fetcher` receives an AbortSignal so in-flight requests are cancelled on unmount/dep change.
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetcherRef.current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
