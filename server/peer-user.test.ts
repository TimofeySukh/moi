import { expect, test } from 'bun:test'

import { socketOwner } from './peer-user'

// Two rows from a real /proc/net/tcp: the control server listening on 13059
// (0x3303), and a client on port 54321 (0xD431) owned by uid 1102.
const TABLE = `  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 0100007F:3303 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1100        0 21831 1 0000000000000000 100 0 0 10 0
   1: 0100007F:D431 0100007F:3303 01 00000000:00000000 00:00000000 00000000  1102        0 21907 1 0000000000000000 20 4 30 10 -1
`

test('finds the owner of the client end of a loopback connection', () => {
  expect(socketOwner(TABLE, 54321, 13059)).toBe(1102)
})

test('returns null when no socket matches both ports', () => {
  expect(socketOwner(TABLE, 54321, 13337)).toBeNull()
  expect(socketOwner(TABLE, 40000, 13059)).toBeNull()
  expect(socketOwner('', 54321, 13059)).toBeNull()
})
