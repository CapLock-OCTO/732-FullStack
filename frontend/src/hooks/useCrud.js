import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";

/**
 * A more advanced version of useGet(), which exposes functions for creating, updating, and deleting
 * items, and being able to have these modifications applied to the "data" state without having to do
 * a re-fetch.
 */
export default function useCrud(baseUrl, initialState = null, idProp = '_id') {
    const [data, setData] = useState(initialState);
    const [isLoading, setLoading] = useState(false);
    const [version, setVersion] = useState(0);
    const [token, setToken] = useState("defaultAccessToken");

    const { getAccessTokenSilently } = useAuth0();


    // Load all data when we first use this hook, or whenever we change the url or re-fetch.
    useEffect(() => {
        async function getAPI() {
            setLoading(true);

            getAccessTokenSilently().then(token => {
                setToken(token);
                // console.log(token);

                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                }

                // console.log(config);
                axios.get(baseUrl, config)
                    .then(response => {
                        setLoading(false);
                        setData(response.data);
                    })
                    .catch(err => {
                        // TODO error handling...
                        console.log("Something goes wrong in the useEffect");
                        console.log(config);
                        setLoading(false);
                    });
            }).catch(err => console.log(err.status + err.message));
        }
        getAPI();
    }, [baseUrl, version, getAccessTokenSilently]);

    // Trigger a re-fetch
    function reFetch() {
        setVersion(version + 1);
    }

    /**
     * Update the given item. If successful, update the corresponding item
     * in the "data" state above.
     * 
     * Alternatively we could pre-emptively update the "data" state to re-render
     * with the new data, then roll it back if the server-side update fails.
     */
    function update(item) {
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        }
        return axios.put(`${baseUrl}/${item[idProp]}`, item, config)
            .then(response => {
                setData(data.map(d =>
                    d[idProp] === item[idProp] ? { ...d, ...item } : d));
            })
            .catch(err => {
                // TODO error handling
            });
    }

    /**
     * Add the given item. If successful, add the corresponding item
     * in the "data" state above.
     * 
     * Alternatively we could pre-emptively update the "data" state to re-render
     * with the new data, then roll it back if the server-side update fails.
     */
    function create(item) {
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        }
        return axios.post(baseUrl, item, config)
            .then(response => {
                const newItem = response.data;
                setData([...data, newItem]);
            })
            .catch(err => {
                // TODO error handling
            });
    }

    /**
     * Remove the item with the given id from the server. If successful, also remove the given
     * item from the "data" state.
     */
    function deleteItem(id) {
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        }
        
        return axios.delete(`${baseUrl}/${id}`, config)
            .then(response => {
                setData(data.filter(item => item[idProp] !== id));
            })
            .catch(err => {
                // TODO error handling
            });
    }

    return { data, isLoading, reFetch, update, create, deleteItem };
}