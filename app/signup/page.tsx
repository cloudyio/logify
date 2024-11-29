import Image from "next/image";
import Github from '../icons/github';

export default function Home({ GithubIcon = Github }) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="card bg-neutral text-neutral-content w-96">
        <div className="card-body text-left">
          <h2 className="card-title text-left font-bold text-white text-2xl">Signup</h2>


            <button className="btn flex items-center justify-center mt-6 w-full">
                <GithubIcon className="text-white fill-current h-7 -mr-6"/>
                <span className="mx-auto">Sign up with Github</span>
            </button>

            <div className="text-center mt-4">
                <p>Already have an account?</p>
                <a href="#" className="link link-primary">Sign in here</a>
            </div>
        </div>
      </div>
    </div>
  );
}