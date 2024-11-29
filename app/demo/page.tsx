"use client"

import Image from "next/image";
import Github from '../icons/github';
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

export default function Home() {
    const [pyodideInstance, setPyodideInstance] = useState<any | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      document.body.classList.add('overflow-hidden');
      return () => {
          document.body.classList.remove('overflow-hidden');
      };
    }, []);

    const [code, setCode] = useState('print ("hello world")');
    const [output, setOutput] = useState('');
    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoading(true);
      setError('');
      setOutput(''); 
      try {
        const response = await fetch('/api/runner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ script: code }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let logsBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decodedValue = decoder.decode(value, { stream: true });
          setOutput((prev) => prev + decodedValue);
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(`Error: ${err.message}`);
      }
    };

  return (
    
    <div className="justify-center flex flex-col">
      <h1 className="text-center text-2xl font-bold mb-2 mt-1"> Demo </h1>
    <div className="flex justify-center items-start pt-10 h-screen overflow-hidden bg-base-200">
        
        <div className="w-screen p-4">
          
            <form action="#" onSubmit={handleSubmit}>
              <div className="flex">
                <div className="w-1/2 pr-2">
                  <label htmlFor="comment" className="sr-only">
                    Add your code
                  </label>
                  <div className="rounded-lg overflow-hidden">
                    <Editor
                      height="70vh"
                      defaultLanguage="python"
                      value={code} 
                      onChange={(value) => setCode(value || '')} 
                      theme="vs-dark"
                    />
                  </div>
                </div>
                <div className="w-1/2 pl-2 flex flex-col">
                  <div className="flex justify-center mb-4 h-[70vh]">
                    <div role="tablist" className="tabs tabs-boxed w-full h-full">
                      <input type="radio" name="my_tabs_1" role="tabpanel" className="tab tab-lifted" aria-label="Instructions" />
                      <div role="tabpanel" className="tab-content p-2 h-full">
                        <div className="w-full h-[65vh] p-2 rounded-md bg-base-100">
                          <h2 className="text-lg font-bold mb-2">Instructions</h2>
                          <p className="mb-2">Create a function named <code>add_numbers</code> that takes 2 parameters, <code>num1</code> and <code>num2</code>. The function should return the total of both numbers.</p>
                          <pre className="bg-gray-900 p-2 rounded-md">
                            <code>
                              {`def add_numbers(num1, num2):\n     return ...`}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="my_tabs_1"
                        role="tab"
                        className="tab tab-lifted"
                        aria-label="Console"
                        defaultChecked />
                      <div role="tabpanel" className="tab-content p-2 h-full">
                        <textarea
                          id="console"
                          readOnly
                          value={loading ? 'Starting docker container...' : output}  
                          className="w-full h-[65vh] p-2 rounded-md resize-none bg-base-100"
                        />
                      </div>
                    </div>
                  </div>
                  <label htmlFor="console" className="sr-only">
                    Console Output
                  </label>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <div className="flex items-center space-x-5"></div>
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Submit'}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500">{error}</p>}
            </form>
          
        </div>
      </div>
      </div>
  );
}