import { useEffect, useState } from 'react';
import client, { errorMessage, unwrap } from '../api/client';

/** Loads the sellable catalog (the API only returns medicines with a LIVE batch to customers). */
export default function useCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/api/v1/medicines')
      .then((res) => {
        const data = unwrap(res);
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load products.')))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
