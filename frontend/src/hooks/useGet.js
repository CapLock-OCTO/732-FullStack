import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";

/**
 * A custom hook which fetches data from the given URL. Includes functionality to determine
 * whether the data is still being loaded or not.
 */
export default function useGet(url, initialState = null) {

    const [data, setData] = useState(initialState);
    const [isLoading, setLoading] = useState(false);
    const [version, setVersion] = useState(0);
    const [token, setToken] = useState("")

    const { getAccessTokenSilently } = useAuth0();

    function reFetch() {
        setVersion(version + 1);
    }

    useEffect(() => {
        async function getAPI() {
            setLoading(true);

            getAccessTokenSilently().then(token => {
                setToken(token);
                const config = {
                    headers: { Authorization: `Bearer ${token}`}
                }
                const response = await axios.get(url, config);
                setData(response.data);
                setLoading(false);

            }).catch();
        }
        getAPI();
    }, [url, version, getAccessTokenSilently]);

    return { data, isLoading, reFetch };
}