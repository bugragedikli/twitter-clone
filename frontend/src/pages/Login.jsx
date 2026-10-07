import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import getErrorMessage from '../utils/getErrorMessage';

const Login = ({ setUser }) => {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const updateField = (field, value) => {
        setForm({ ...form, [field]: value });
        setError(""); // hide the old error once the user starts fixing it
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try{
            const data = await login(form);
            setUser(data.user);
            navigate('/');
        }catch(err){
            console.error(err);
            setError(getErrorMessage(err, "Sign in failed. Please try again."));
        }finally{
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md p-5 border rounded">
                <h2>Sign In</h2>
                {error && <p role="alert" className="text-red-500 mb-3">{error}</p>}
                <input
                    type="email"
                    placeholder="email"
                    required
                    className="border p-2 w-full mb-3"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                />
                <input
                    type="password"
                    placeholder="password"
                    required
                    className="border p-2 w-full mb-3"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-500 text-white p-2 w-full hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                    Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register</Link>
                </p>
            </form>
        </div>
    )
};

export default Login;
