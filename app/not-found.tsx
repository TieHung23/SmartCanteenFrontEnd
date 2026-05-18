import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 text-center">

            <h1 className="text-9xl font-extrabold text-orange-500 drop-shadow-lg">
                404
            </h1>

            <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-3">
                Not found page
            </h2>

            <p className="text-gray-500 mb-8 max-w-md">
                Sorry, the page you are looking for does not exist, has been removed, renamed or is temporarily unavailable.
            </p>

            <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full px-8 py-6 shadow-md transition-transform hover:scale-105">
                <Link href="/">
                    Back to Home Page
                </Link>
            </Button>
        </div>
    );
}
