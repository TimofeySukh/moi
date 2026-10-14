// Who is on the other end of a control-port connection? It only matters on
// managed machines (an `agentLauncher` is configured), where the agent runs as
// its own OS user: it may use the `moi` CLI but not the commands that set up
// moi itself. Linux lists every TCP socket with its owner in /proc/net/tcp; the
// client's socket is the one whose local port is the connection's remote port.
import { readFileSync } from 'node:fs'

import { getAppConfig } from './app-config'
import { CONTROL_PORT } from './constants'

const TCP_TABLES = ['/proc/net/tcp', '/proc/net/tcp6']

// Owner uid of the socket bound to `localPort` and connected to `remotePort`,
// from the text of a /proc/net/tcp table; null when no row matches.
export function socketOwner(table: string, localPort: number, remotePort: number): number | null {
  for (const line of table.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/)
    if (fields.length < 8) continue
    const local = Number.parseInt(fields[1].split(':')[1] ?? '', 16)
    const remote = Number.parseInt(fields[2].split(':')[1] ?? '', 16)
    if (local === localPort && remote === remotePort) return Number(fields[7])
  }
  return null
}

// True when the connection comes from moi's own OS user. Local installs are a
// single user, so everything passes there; a managed machine fails closed when
// the owner can't be found.
export function isFromMoiUser(peer: { port: number } | null): boolean {
  if (!getAppConfig().agentLauncher) return true
  if (!peer || !process.getuid) return false
  for (const file of TCP_TABLES) {
    let table: string
    try {
      table = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const owner = socketOwner(table, peer.port, CONTROL_PORT)
    if (owner !== null) return owner === process.getuid()
  }
  return false
}
