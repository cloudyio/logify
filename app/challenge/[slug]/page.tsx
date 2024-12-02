"use client"

import { auth } from "@/auth";
import React, { useEffect, useRef, useState, FormEvent } from "react";
import Editor from "@monaco-editor/react";
import fs from 'fs/promises';

interface Params {
  slug: string;
}

interface ChallengeData {
  challenge: {
    title: string;
    description: string;
    instructions: string[];
    example: {
      code: string;
      explanation: string;
    };
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>
}) {
  const session = await auth();

  if (!session) return <div>Not authenticated</div>;

  const slug = (await params).slug;
  let data: ChallengeData;
  try {
    const file = await fs.readFile(process.cwd() + '/challenges/' + slug + '.json', 'utf8');
    data = JSON.parse(file);
  } catch (e) {
    return <div>Not found</div>;
  }

  return <Demo data={data} />;
}

function Demo({ data }: { data: ChallengeData }) {
  const [pyodideInstance, setPyodideInstance] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidScript, setInvalidScript] = useState(false);

  const consoleTabRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [code, setCode] = useState('print ("hello world")');
  const [output, setOutput] = useState('');
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setOutput('');
    setSuccess(false);
    setInvalidScript(false);
    try {
      const response = await fetch('/api/demo/runner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Invalid script input') {
          setInvalidScript(true);
          setLoading(false);
          return;
        }
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      let allTestsPassed = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedValue = decoder.decode(value, { stream: true });
        setOutput((prev) => prev + decodedValue);

        if (decodedValue.includes("1 or more checks failed")) {
          allTestsPassed = false;
        }
      }

      setLoading(false);

      if (allTestsPassed) {
        setToastMessage("All tests passed successfully!");
        setSuccess(true);
      } else {
        setToastMessage("1 or more checks failed...");
        setSuccess(false);
      }

      if (consoleTabRef.current) {
        consoleTabRef.current.checked = true;
      }

    } catch (err: any) {
      setLoading(false);
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="justify-center flex flex-col">
      <h1 className="text-center text-2xl font-bold mb-2 mt-1"> {data.challenge.title} </h1>
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
                        <p className="mb-2">{data.challenge.description}</p>
                        <ul>
                          {data.challenge.instructions.map((instruction, index) => (
                            <li key={index} className="ml-6">{instruction}</li>
                          ))}
                        </ul>
                        <br />
                        <pre className="bg-gray-900 p-2 rounded-md">
                          <code>{data.challenge.example.code}</code>
                        </pre>
                        <p>{data.challenge.example.explanation}</p>
                        <br />
                        <p className="mb-2">
                          Code can be edited in the left editor. Once you think you are correct, click submit to run your code.
                        </p>
                        <p>
                          Three different checks will be run, you will be informed if the code worked as planned and returned the correct output.
                        </p>
                        <br />
                        <br />
                        For harder challenges create an account!
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="my_tabs_1"
                      role="tab"
                      className="tab tab-lifted"
                      aria-label="Console"
                      defaultChecked
                      ref={consoleTabRef}
                    />
                    <div role="tabpanel" className="tab-content p-2 h-full">
                      <pre
                        id="console"
                        className={`w-full h-[65vh] p-2 rounded-md overflow-auto transition-colors duration-500 ${success ? 'bg-green-500 text-black' : 'bg-base-100 text-white'}`}
                      >
                        {loading ? 'Starting docker container...' : output}
                      </pre>
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
                  disabled={loading || success}
                >
                  {loading ? 'Loading...' : 'Submit'}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {invalidScript && <p className="text-red-500">Invalid script input detected. Please remove any restricted keywords.</p>}
          </form>
        </div>
      </div>
      {toastMessage && (
        <div className="toast">
          <div className={`alert ${success ? 'alert-success' : 'alert-error'}`}>
            <div>
              <span>{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}