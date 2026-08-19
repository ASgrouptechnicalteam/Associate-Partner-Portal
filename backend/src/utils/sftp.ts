import SftpClient from 'ssh2-sftp-client';

const sftp = new SftpClient();

const getConfig = () => {
  const host = process.env.SFTP_HOST;
  const port = Number(process.env.SFTP_PORT || 65002);
  const username = process.env.SFTP_USER;
  const password = process.env.SFTP_PASSWORD;
  const basePath = process.env.SFTP_BASE_PATH;

  if (!host || !username || !password || !basePath) {
    throw new Error(
      'SFTP configuration is incomplete. Check SFTP_HOST, SFTP_USER, SFTP_PASSWORD and SFTP_BASE_PATH.'
    );
  }

  return {
    host,
    port,
    username,
    password,
    basePath
  };
};

export const getSftpBasePath = (): string => {
  return getConfig().basePath;
};

export const uploadToHostinger = async (
  localFilePath: string,
  remoteFileName: string,
  folder: string
): Promise<string> => {
  const config = getConfig();

  const remoteDirectory = `${config.basePath}/${folder}`;
  const remotePath = `${remoteDirectory}/${remoteFileName}`;

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password
    });

    await sftp.mkdir(remoteDirectory, true);
    await sftp.put(localFilePath, remotePath);

    return `/uploads/${folder}/${remoteFileName}`;
  } finally {
    await sftp.end().catch(() => undefined);
  }
};