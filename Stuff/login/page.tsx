import Link from "next/link"
import { Button } from "@/components/ui/button";
export default function LoginPage() {
    return(
        <div className= "flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-3xl font-bold text-center text-primary-900">Login to Your Account</h2>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="email">Email: </label>
                        <input type="email" placeholder=" Enter Email"/>
                    </div>
                    <div>
                        <label htmlFor="password">Password: </label>
                        <input type="password" placeholder=" Enter Password"/>
                    </div>
                    <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 mt-4">
                        Continue
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    {"Don't have an account? "}
                    <Link href="/register" className="text-primary-600 hover:underline">
                        Register Here
                    </Link>
                </p>
            </div>
            
        </div>
    )
}