import SearchForm from "./searchTab_components/SearchFrom";
import SearchResults from "./searchTab_components/SearchResults";
import { useState, useEffect } from "react";

export default function SearchTab() {
  const [results, setResults] = useState([]);
  const [wraped, setWraped] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const wrap = () => {
      let answer = {};
      results.map((r, i) => (answer[i] = false));

      setWraped(answer);
      console.log(answer);
    };

    results.length > 0 && wrap();
  }, [results]);

  return (
    <div className="flex flex-col gap-3">
      <SearchForm setResults={setResults} setIsLoading={setIsLoading} />
      <div className="flex flex-row flex-wrap gap-3">
        <SearchResults
          results={results}
          wraped={wraped}
          setWraped={setWraped}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
