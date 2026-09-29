import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

const Login = ({ setUser }) => {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const data = await login(form);
            setUser(data.user);
            navigate('/');
        }catch(err){
            console.error(err);
            setError("Invalid email or password");
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md p-5 border rounded">
                <h2>Sign In</h2>
                {error && <p className="text-red-500">{error}</p>}
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
                <button type="submit" className="bg-blue-500 text-white p-2 w-full hover:bg-blue-600 cursor-pointer" >Sign In</button>
            </form>
        </div>
    )
};

export default Login;