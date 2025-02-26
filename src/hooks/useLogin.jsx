import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { userService } from "../services/apis";
import {toast} from 'react-toastify';
import axios from "axios";

export const useLogin = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(null);
    const { dispatch } = useAuthContext();

    const login = (username, password) => {
        const id = toast.loading("Please wait...");
        setLoading(true);
        setError(null);

        /*
        userService
            .loginUser({
                password: password,
                email: username,
            })
            .then((res) => {
                localStorage.setItem("user", res.auth_token);
                dispatch({ type: 'LOGIN', payload: res.auth_token });
                setLoading(false);
                toast.update(id, { render: "Logged in successfully !", type: "success", isLoading: false, autoClose:4000 })
            })
            .catch((err) => {
                setLoading(false);
                setError(err);
                toast.update(id, { render: (err.data[Object.keys(err.data)[0]])[0], type: "error", isLoading: false, autoClose:4000 })
            });
        */

        userService
        .loginUser({
            password: password,
            email: username,
        })
        .then((res) => {
            // console.log("ih")
            localStorage.setItem("user", res.token);
          
            dispatch({ type: 'LOGIN', payload: res.token });
            setLoading(false);
            toast.update(id, { render: "Logged in successfully !", type: "success", isLoading: false, autoClose:2300 })
        })
        .catch((err) => {
            // console.log(err)
            toast.update(id, { render: "Wrong Credentials!!", type: "error", isLoading: false, autoClose:2300 })
            // console.clear()
            // axios.post(`${import.meta.env.VITE_MAINWEB_BACKEND}verify/user/`, {
            //     username: username,
            //     password: password,
            //     event: "Wallstreet",
            //     is_team: false
            // })
            // .then((res)=>{
            //     if(res.data.detail==="verified"){
            //         userService.registerUser({
            //             email: res.data.user.email,
            //             name: res.data.user.username,
            //             password: password,
            //             contact_no: res.data.user.phone,
            //             first_name: res.data.user.first_name,
            //             last_name: res.data.user.last_name,
            //         })
            //         .then((res) => {
            //             userService
            //             .loginUser({
            //                 password: password,
            //                 name: username,
            //             })
            //             .then((res) => {
            //                 localStorage.setItem("user", res.auth_token);
            //                 dispatch({ type: 'LOGIN', payload: res.auth_token });
            //                 setLoading(false);
            //                 toast.update(id, { render: "Logged in successfully !", type: "success", isLoading: false, autoClose:2300 })
            //             })
            //         })
            //         .catch((err) => {
            //             toast.update(id, { render: err.response.data.detail, type: "error", isLoading: false, autoClose:2300 })
            //             console.clear()
            //         })
            //     }
            // })
            // .catch((err)=>{
            //     console.log(err)
            //     // console.clear()
            //     toast.update(id, { render: err.response.data.detail, type: "error", isLoading: false, autoClose:2300 })
            //     // console.clear()
            // })
            // setLoading(false);
            // setError(err);
        });

            
    };

    return { login, error, loading };
};