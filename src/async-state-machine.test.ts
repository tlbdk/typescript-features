import inspector from 'inspector'

import { AsyncStateMachine } from './async-state-machine'

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

export interface ServerAbortMessage {
  type: 'server_abort'
}

export type ServerMessage = ServerGetVersionMessage | ServerGetHardwareMessage | ServerAbortMessage

export class ServerStateMachine extends AsyncStateMachine<'get-version' | 'get-hardware', UnitMessage, ServerMessage> {
  protected async run(): Promise<void> {
    const version = await this.getVersion()
    await new Promise(resolve => setTimeout(resolve, 100))
    const hardware = await this.getHardware()
    // eslint-disable-next-line no-console
    console.log(`${version}: ${hardware}`)
  }

  protected async reset(): Promise<void> {
    this.write({
      type: 'server_abort'
    })
  }

  protected async getHardware(): Promise<string> {
    this.write({ type: 'server_get_hardware' })
    this.setState('get-hardware')
    const versionMessage = await this.waitForIn<UnitHardwareMessage>(m => m.type === 'unit_hardware')
    return versionMessage.hardware
  }

  protected async getVersion(): Promise<string> {
    this.write({ type: 'server_get_version' })
    this.setState('get-version')
    const versionMessage = await this.waitForIn<UnitVersionMessage>(m => m.type === 'unit_version')
    return versionMessage.version
  }
}

describe('AsyncStateMachine', () => {
  const readTimeout = inspector.url() !== undefined ? 2147483647 : undefined

  it('should request version and hardware', async () => {
    const machine = new ServerStateMachine({ readTimeout })

    await machine.waitForOut(m => m.type === 'server_get_version')
    machine.emit('in', { type: 'unit_version', version: '1.2' })

    await machine.waitForOut(m => m.type === 'server_get_hardware')
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
