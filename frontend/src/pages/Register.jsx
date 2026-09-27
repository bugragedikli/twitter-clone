import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = ({ setUser }) => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const res = await axios.post('http://localhost:3000/auth/register', form);
            setUser(res.data.user);
            navigate('/');
        }catch(err){
            console.error(err);
            setError("Registration failed.");
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md p-5 border rounded">
                <h2>Create an Account</h2>
                {error && <p className="text-red-500">{error}</p>}
                <input 
                    type="text" 
                    placeholder="Username"
                    className="border p-2 w-full mb-3" 
                    value={form.username} 
                    onChange={(e) => setForm({...form, username: e.target.value})} 
                />
                <input 
                    type="email" 
                    placeholder="email" 
                    className="border p-2 w-full mb-3" 
                    value={form.email} 
                    onChange={(e) => setForm({...form, email: e.target.value})} 
                />
                <input 
                    type="password" 
                    placeholder="password" 
                    className="border p-2 w-full mb-3" 
                    value={form.password} 
                    onChange={(e) => setForm({...form, password: e.target.value})} 
                />
                <button type="submit" className="bg-blue-500 text-white p-2 w-full hover:bg-blue-600 cursor-pointer" >Register</button>
            </form>
        </div>
    )
};

export default Register;