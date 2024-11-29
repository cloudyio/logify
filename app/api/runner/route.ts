import { exec } from 'child_process';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

const docker = new Docker();

export async function POST(request: Request) {
  const { script } = await request.json();

  if (!script) {
    return new Response(JSON.stringify({ error: 'you need to input something!' }), { status: 400 });
  }

  try {
    const code = `
def add_numbers(a, b):
    return

${script}

checks = [[1,2,3], [4,7,11], [-5,3,-2]]
failed = False

for check in checks:
    try:
        total = add_numbers(check[0], check[1])
        if total != check[2]:
            print(f"Error: {check[0]} + {check[1]} = {total}, but expected {check[2]}")
            failed = True
        else:
            print(f"Success: {check[0]} + {check[1]} = {total}")
    except Exception as e:
        print(f"Exception occurred: {e}")
        failed = True

if not failed:
    print("All checks passed successfully")
else:
    print("1 or more checks failed")
`;

    const container = await docker.createContainer({
      Image: 'python:3.9',
      Cmd: ['python', '-u', '-c', code], 
      HostConfig: {
        AutoRemove: true,
        Memory: 128 * 1024 * 1024,
        NanoCpus: 500000000,
      },
    });

    console.log('container created:', container.id);

    await container.start();

    const logStream = await container.attach({ stream: true, stdout: true, stderr: true });

    const readableStream = new ReadableStream({
      start(controller) {
        logStream.on('data', (chunk) => {
          const logLines = parseDockerStream(chunk);
          logLines.forEach((line) => {
            controller.enqueue(line + '\n'); 
          });
        });

        logStream.on('end', () => {
          controller.close(); 
        });

        logStream.on('error', (err) => {
          controller.error(err); 
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to execute code' }), { status: 500 });
  }
}

function parseDockerStream(chunk: any) {
  const lines = [];
  let offset = 0;

  while (offset < chunk.length) {
    const streamType = chunk.readUInt8(offset); 
    const payloadLength = chunk.readUInt32BE(offset + 4); 

    const logContent = chunk.slice(offset + 8, offset + 8 + payloadLength).toString('utf8');
    lines.push(`${logContent}`);

    offset += 8 + payloadLength;
  }

  return lines;
}