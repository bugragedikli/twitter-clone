import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import getErrorMessage from '../utils/getErrorMessage';

const Register = ({ setUser }) => {
    const [form, setForm] = useState({
        username: "",
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
            const data = await register(form);
            setUser(data.user);
            navigate('/');
        }catch(err){
            console.error(err);
            setError(getErrorMessage(err, "Registration failed. Please try again."));
        }finally{
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md p-5 border rounded">
                <h2>Create an Account</h2>
                {error && <p role="alert" className="text-red-500 mb-3">{error}</p>}
                <input
                    type="text"
                    placeholder="Username"
                    required
                    className="border p-2 w-full"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1 mb-3">3-15 characters: letters, numbers and _</p>
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
                    className="border p-2 w-full"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1 mb-3">At least 8 characters</p>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-500 text-white p-2 w-full hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating account...' : 'Register'}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
                </p>
            </form>
        </div>
    )
};

export default Register;
