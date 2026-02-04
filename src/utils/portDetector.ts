/**
 * Utility to detect the backend server port dynamically
 * Tries multiple methods:
 * 1. API endpoint /api/port
 * 2. port.json file
 * 3. Common ports (5000, 5001, etc.)
 */

const PORT_CACHE_KEY = 'hustlex_backend_port';
const PORT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface PortInfo {
  port: number;
  url: string;
  timestamp: number;
}

/**
 * Try to detect port by attempting to fetch from API
 */
async function detectPortFromAPI(basePort: number): Promise<number | null> {
  const commonPorts = Array.from(new Set([basePort, 5000, 5001, 5002, 5003, 3000, 3001]));

  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://localhost:${port}/api/port`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000), // 1 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.port) {
          return data.port;
        }
      } else if (response.status === 429) {
        // If we get 429, the server is there but we're rate limited
        console.warn(`Port ${port} detected but rate limited (429)`);
        return port;
      }
    } catch (error) {
      // Port not available, try next
      continue;
    }
  }

  return null;
}

/**
 * Try to read port from port.json file
 */
async function detectPortFromFile(): Promise<number | null> {
  try {
    const response = await fetch('/port.json', {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.port) {
        return data.port;
      }
    }
  } catch (error) {
    // File not available, continue
  }

  return null;
}

/**
 * Try common ports by checking health endpoint
 */
async function detectPortByHealthCheck(basePort: number): Promise<number | null> {
  const commonPorts = Array.from(new Set([basePort, 5000, 5001, 5002, 5003, 3000, 3001]));

  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok || response.status === 429) {
        if (response.status === 429) {
          console.warn(`Port ${port} detected by health check but rate limited (429)`);
        }
        return port;
      }
    } catch (error) {
      // Port not available, try next
      continue;
    }
  }

  return null;
}

/**
 * Get cached port if still valid
 */
function getCachedPort(): number | null {
  try {
    const cached = localStorage.getItem(PORT_CACHE_KEY);
    if (cached) {
      const portInfo: PortInfo = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - portInfo.timestamp < PORT_CACHE_TIMEOUT) {
        return portInfo.port;
      }
    }
  } catch (error) {
    // Invalid cache, ignore
  }

  return null;
}

/**
 * Cache the detected port
 */
function cachePort(port: number): void {
  try {
    const portInfo: PortInfo = {
      port,
      url: `http://localhost:${port}`,
      timestamp: Date.now(),
    };
    localStorage.setItem(PORT_CACHE_KEY, JSON.stringify(portInfo));
  } catch (error) {
    // localStorage not available, ignore
  }
}

/**
 * Detect backend port using multiple methods
 */
export async function detectBackendPort(basePort: number = 5000): Promise<number> {
  // Check cache first
  const cachedPort = getCachedPort();
  if (cachedPort) {
    // Verify cached port is still working
    try {
      const response = await fetch(`http://localhost:${cachedPort}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(500),
      });
      if (response.ok || response.status === 429) {
        return cachedPort;
      }
    } catch (error) {
      // Cached port not working, continue detection
    }
  }

  // Try API endpoint first (most reliable)
  let detectedPort = await detectPortFromAPI(basePort);
  if (detectedPort) {
    cachePort(detectedPort);
    return detectedPort;
  }

  // Try reading from port.json file
  detectedPort = await detectPortFromFile();
  if (detectedPort) {
    cachePort(detectedPort);
    return detectedPort;
  }

  // Try health check on common ports
  detectedPort = await detectPortByHealthCheck(basePort);
  if (detectedPort) {
    cachePort(detectedPort);
    return detectedPort;
  }

  // Fallback to base port
  return basePort;
}

/**
 * Get backend base URL
 */
export async function getBackendUrl(): Promise<string> {
  if (typeof window !== 'undefined' && window.location.hostname.includes("devtunnels")) {
    return `https://${window.location.hostname}`;
  }

  const port = await detectBackendPort(5000);
  return `http://localhost:${port}`;
}

/**
 * Get backend API URL
 */
export async function getBackendApiUrl(): Promise<string> {
  const baseUrl = await getBackendUrl();
  return `${baseUrl}/api`;
}

/**
 * Synchronous version that uses cached port or falls back to default
 * Use this for immediate needs, but prefer async versions
 */
export function getBackendPortSync(defaultPort: number = 5000): number {
  const cached = getCachedPort();
  return cached || defaultPort;
}

export function getBackendUrlSync(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes("devtunnels")) {
    return `https://${window.location.hostname}`;
  }

  const port = getBackendPortSync(5000);
  return `http://localhost:${port}`;
}

export function getBackendApiUrlSync(): string {
  const baseUrl = getBackendUrlSync();
  return `${baseUrl}/api`;
}
