import Docker from 'dockerode';
import { promises as fs } from 'fs';

const docker = new Docker();


export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return new Response('ID not provided', { status: 400 });
  }

  const file = await fs.readFile(process.cwd() + '/challenges/' + id + ".json", 'utf8');
  const data = JSON.parse(file);

    return new Response(JSON.stringify(data), { status: 200 });
}