import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen bg-white">
            <div className="hidden lg:block w-1/2 relative bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                    alt="Restaurant Decor"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-12 left-12">
                    <h2 className="text-5xl font-serif text-white drop-shadow-lg">How do you<br />feel today?</h2>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
                <div className="w-full max-w-sm flex flex-col items-center -mt-30">
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="Mascot"
                            className="w-56 h-56 object-contain drop-shadow-2xl"
                        />
                    </div>

                    <div className="w-full mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Sign in</h1>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
