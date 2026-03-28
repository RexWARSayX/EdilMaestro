import type { GithubBackupEntry } from '../types';

const GITHUB_OWNER = 'RexWARSayX';
const GITHUB_REPO = 'EdilMaestro';
const GITHUB_BRANCH = 'main';
const GITHUB_BACKUP_DIRECTORY = 'backups';
const GITHUB_TOKEN_STORAGE_KEY = 'edilmaestro-github-token';

interface GithubContentItem {
  type: string;
  name: string;
  path: string;
  sha?: string;
  content?: string;
  encoding?: string;
  download_url?: string | null;
}

function createApiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`;
}

function createRawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;
}

function sortBackups(backups: GithubBackupEntry[]): GithubBackupEntry[] {
  return [...backups].sort((left, right) => {
    if (left.name === 'latest.json') {
      return -1;
    }

    if (right.name === 'latest.json') {
      return 1;
    }

    return right.name.localeCompare(left.name);
  });
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function decodeBase64(value: string): string {
  const normalizedValue = value.replace(/\s/g, '');
  const binary = atob(normalizedValue);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function readGithubError(response: Response): Promise<string> {
  try {
    const payload = await response.json();

    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    return response.statusText || 'Errore GitHub sconosciuto.';
  }

  return response.statusText || 'Errore GitHub sconosciuto.';
}

async function getExistingFileSha(path: string, token: string): Promise<string | undefined> {
  const response = await fetch(createApiUrl(`contents/${path}?ref=${GITHUB_BRANCH}`), {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`Impossibile leggere il file GitHub ${path}: ${await readGithubError(response)}`);
  }

  const payload = (await response.json()) as GithubContentItem;
  return payload.sha;
}

async function putFileOnGithub(path: string, content: string, token: string, message: string, sha?: string): Promise<void> {
  const response = await fetch(createApiUrl(`contents/${path}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Impossibile salvare il backup su GitHub: ${await readGithubError(response)}`);
  }
}

export function loadGithubBackupToken(): string {
  return window.localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) ?? '';
}

export function saveGithubBackupToken(token: string): void {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    window.localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, trimmedToken);
}

export function getGithubBackupLocation(): string {
  return `${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BACKUP_DIRECTORY}`;
}

export async function listGithubBackups(token?: string): Promise<GithubBackupEntry[]> {
  const response = await fetch(createApiUrl(`contents/${GITHUB_BACKUP_DIRECTORY}?ref=${GITHUB_BRANCH}`), {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {})
    }
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Impossibile leggere la cartella backup su GitHub: ${await readGithubError(response)}`);
  }

  const payload = (await response.json()) as GithubContentItem[];
  const backups = payload
    .filter((item) => item.type === 'file' && item.name.endsWith('.json'))
    .map((item) => ({
      name: item.name,
      path: item.path,
      downloadUrl: item.download_url ?? createRawUrl(item.path)
    }));

  return sortBackups(backups);
}

export async function downloadGithubBackup(backup: GithubBackupEntry, token?: string): Promise<string> {
  const response = await fetch(createApiUrl(`contents/${backup.path}?ref=${GITHUB_BRANCH}`), {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Impossibile scaricare ${backup.name} da GitHub: ${await readGithubError(response)}`);
  }

  const payload = (await response.json()) as GithubContentItem;

  if (payload.encoding !== 'base64' || typeof payload.content !== 'string') {
    throw new Error(`Il file ${backup.name} non e stato restituito in un formato leggibile da GitHub.`);
  }

  return decodeBase64(payload.content);
}

export async function uploadGithubBackup(content: string, token: string): Promise<{ fileName: string }> {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    throw new Error('Inserisci un token GitHub con permesso Contents: Read and write sul repository.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `edilmaestro-backup-${timestamp}.json`;
  const archivePath = `${GITHUB_BACKUP_DIRECTORY}/${fileName}`;
  const latestPath = `${GITHUB_BACKUP_DIRECTORY}/latest.json`;

  await putFileOnGithub(archivePath, content, trimmedToken, `Add backup ${fileName}`);

  const latestSha = await getExistingFileSha(latestPath, trimmedToken);
  await putFileOnGithub(latestPath, content, trimmedToken, `Update latest backup ${fileName}`, latestSha);

  return { fileName };
}