import inspector from 'inspector'

import { AsyncStateMachine, OutListener } from './async-state-machine'

export interface UnitVersionMessage {
  type: 'unit_version'
  version: string
}

export interface UnitHardwareMessage {
  type: 'unit_hardware'
  hardware: string
}

export type UnitMessage = UnitVersionMessage | UnitHardwareMessage

export interface ServerGetVersionMessage {
  type: 'server_get_version'
}

export interface ServerGetHardwareMessage {
  type: 'server_get_hardware'
}

export type ServerMessage = ServerGetVersionMessage | ServerGetHardwareMessage

export class ServerStateMachine extends AsyncStateMachine<UnitMessage, ServerMessage> {
  public async waitForServer(predicate: (m: ServerMessage) => boolean, timeout = 1000): Promise<ServerMessage> {
    return await new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Timed out waiting for message, last messages was`))
      }, timeout)

      const listener: OutListener<ServerMessage> = obj => {
        if (predicate(obj)) {
          clearTimeout(timeoutHandle)
          this.removeListener('out', listener)
          resolve(obj)
        }
      }
      this.on('out', obj => listener(obj))
    })
  }

  protected async stateMachine(): Promise<void> {
    const version = await this.getVersion()
    await new Promise(resolve => setTimeout(resolve, 100))
    const hardware = await this.getHardware()
    // eslint-disable-next-line no-console
    console.log(`${version}: ${hardware}`)
  }

  protected async getHardware(): Promise<string> {
    this.writeMessages({ type: 'server_get_hardware' })
    const versionMessage = await this.waitFor<UnitHardwareMessage>(m => m.type === 'unit_hardware')
    return versionMessage.hardware
  }

  protected async getVersion(): Promise<string> {
    this.writeMessages({ type: 'server_get_version' })
    const versionMessage = await this.waitFor<UnitVersionMessage>(m => m.type === 'unit_version')
    return versionMessage.version
  }
}

describe('AsyncStateMachine', () => {
  const readTimeout = inspector.url() !== undefined ? 0 : undefined

  it('should request version and hardware', async () => {
    const machine = new ServerStateMachine({ readTimeout })

    await machine.waitForServer(m => m.type === 'server_get_version')
    machine.emit('in', { type: 'unit_version', version: '1.2' })

    await machine.waitForServer(m => m.type === 'server_get_hardware')
    machine.emit('in', { type: 'unit_hardware', hardware: 'hw2' })

    await new Promise<void>(resolve => setTimeout(resolve, 10))

    expect(machine.hasCompleted()).toEqual(true)

    // const serverMessages: ServerMessage[] = []
    // machine.on('out', m => {
    //   serverMessages.push(m)
    //   switch (m.type) {
    //     case 'server_get_version': {
    //       machine.emit('in', { type: 'unit_version', version: '1.2' })
    //       break
    //     }
    //     case 'server_get_hardware': {
    //       machine.emit('in', { type: 'unit_hardware', hardware: '1.2' })
    //       break
    //     }
    //   }
    // })
  })
})
