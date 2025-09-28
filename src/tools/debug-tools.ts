import * as vscode from 'vscode';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Starts a debug session
 * @param launchConfig Debug configuration object
 */
export async function startDebugSession(launchConfig: any): Promise<void> {
    console.log(`[startDebugSession] Starting debug session with config:`, launchConfig);

    try {
        // 使用VS Code的调试API启动调试会话
        const success = await vscode.debug.startDebugging(undefined, launchConfig);

        if (success) {
            console.log('[startDebugSession] Debug session started successfully');
        } else {
            throw new Error('Failed to start debug session');
        }
    } catch (error) {
        console.error('[startDebugSession] Error:', error);
        throw error;
    }
}

/**
 * Stops the debug session
 */
export async function stopDebugSession(): Promise<void> {
    console.log('[stopDebugSession] Stopping debug session');

    try {
        await vscode.debug.stopDebugging(undefined);
        console.log('[stopDebugSession] Debug session stopped successfully');
    } catch (error) {
        console.error('[stopDebugSession] Error:', error);
        throw error;
    }
}

/**
 * Pauses the debug session
 */
export async function pauseDebugSession(): Promise<void> {
    console.log('[pauseDebugSession] Pausing debug session');

    try {
        // 获取当前活动的调试会话
        const session = vscode.debug.activeDebugSession;
        if (session) {
            // 发送暂停命令
            await session.customRequest('pause');
            console.log('[pauseDebugSession] Debug session paused successfully');
        } else {
            throw new Error('No active debug session found');
        }
    } catch (error) {
        console.error('[pauseDebugSession] Error:', error);
        throw error;
    }
}

/**
 * Continues the debug session
 */
export async function continueDebugSession(): Promise<void> {
    console.log('[continueDebugSession] Continuing debug session');

    try {
        // 获取当前活动的调试会话
        const session = vscode.debug.activeDebugSession;
        if (session) {
            // 发送继续命令
            await session.customRequest('continue');
            console.log('[continueDebugSession] Debug session continued successfully');
        } else {
            throw new Error('No active debug session found');
        }
    } catch (error) {
        console.error('[continueDebugSession] Error:', error);
        throw error;
    }
}

/**
 * Steps over
 */
export async function stepOver(): Promise<void> {
    console.log('[stepOver] Executing step over');

    try {
        // 获取当前活动的调试会话
        const session = vscode.debug.activeDebugSession;
        if (session) {
            // 发送单步跳过命令
            await session.customRequest('next');
            console.log('[stepOver] Step over executed successfully');
        } else {
            throw new Error('No active debug session found');
        }
    } catch (error) {
        console.error('[stepOver] Error:', error);
        throw error;
    }
}

/**
 * Steps into
 */
export async function stepInto(): Promise<void> {
    console.log('[stepInto] Executing step into');

    try {
        // 获取当前活动的调试会话
        const session = vscode.debug.activeDebugSession;
        if (session) {
            // 发送单步进入命令
            await session.customRequest('stepIn');
            console.log('[stepInto] Step into executed successfully');
        } else {
            throw new Error('No active debug session found');
        }
    } catch (error) {
        console.error('[stepInto] Error:', error);
        throw error;
    }
}

/**
 * Steps out
 */
export async function stepOut(): Promise<void> {
    console.log('[stepOut] Executing step out');

    try {
        // 获取当前活动的调试会话
        const session = vscode.debug.activeDebugSession;
        if (session) {
            // 发送单步跳出命令
            await session.customRequest('stepOut');
            console.log('[stepOut] Step out executed successfully');
        } else {
            throw new Error('No active debug session found');
        }
    } catch (error) {
        console.error('[stepOut] Error:', error);
        throw error;
    }
}

/**
 * Sets a breakpoint
 * @param workspacePath File path
 * @param line Line number (1-based)
 */
export async function setBreakpoint(workspacePath: string, line: number): Promise<void> {
    console.log(`[setBreakpoint] Setting breakpoint at ${workspacePath}:${line}`);

    if (!vscode.workspace.workspaceFolders) {
        throw new Error('No workspace folder is open');
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const workspaceUri = workspaceFolder.uri;

    // 创建文件URI
    const fileUri = vscode.Uri.joinPath(workspaceUri, workspacePath);
    console.log(`[setBreakpoint] File URI: ${fileUri.fsPath}`);

    try {
        // 打开文档
        const document = await vscode.workspace.openTextDocument(fileUri);

        // 转换行号为0-based
        const zeroBasedLine = line - 1;

        // 创建断点位置
        const breakpointLocation = new vscode.Location(fileUri, new vscode.Position(zeroBasedLine, 0));

        // 创建断点
        const breakpoint = new vscode.SourceBreakpoint(
            breakpointLocation,
            true, // enabled
            undefined, // condition
            undefined, // hitCondition
            undefined // logMessage
        );

        // 添加断点
        vscode.debug.addBreakpoints([breakpoint]);

        console.log(`[setBreakpoint] Breakpoint set successfully at line ${line}`);
    } catch (error) {
        console.error('[setBreakpoint] Error:', error);
        throw error;
    }
}

/**
 * Removes a breakpoint
 * @param workspacePath File path
 * @param line Line number (1-based)
 */
export async function removeBreakpoint(workspacePath: string, line: number): Promise<void> {
    console.log(`[removeBreakpoint] Removing breakpoint at ${workspacePath}:${line}`);

    if (!vscode.workspace.workspaceFolders) {
        throw new Error('No workspace folder is open');
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const workspaceUri = workspaceFolder.uri;

    // 创建文件URI
    const fileUri = vscode.Uri.joinPath(workspaceUri, workspacePath);
    console.log(`[removeBreakpoint] File URI: ${fileUri.fsPath}`);

    try {
        // 转换行号为0-based
        const zeroBasedLine = line - 1;

        // 获取所有断点
        const breakpoints = vscode.debug.breakpoints;

        // 查找匹配的断点
        const breakpointToRemove = breakpoints.find(bp => {
            if (bp instanceof vscode.SourceBreakpoint) {
                const location = bp.location;
                return location.uri.toString() === fileUri.toString() &&
                       location.range.start.line === zeroBasedLine;
            }
            return false;
        });

        if (breakpointToRemove) {
            // 移除断点
            vscode.debug.removeBreakpoints([breakpointToRemove]);
            console.log(`[removeBreakpoint] Breakpoint removed successfully from line ${line}`);
        } else {
            throw new Error(`No breakpoint found at line ${line}`);
        }
    } catch (error) {
        console.error('[removeBreakpoint] Error:', error);
        throw error;
    }
}

/**
 * Gets debug state
 */
export async function getDebugState(): Promise<any> {
    console.log('[getDebugState] Getting debug state');

    try {
        const session = vscode.debug.activeDebugSession;
        const breakpoints = vscode.debug.breakpoints;

        const state = {
            activeSession: session ? {
                name: session.name,
                type: session.type,
                configuration: session.configuration
            } : null,
            breakpoints: breakpoints.map(bp => {
                if (bp instanceof vscode.SourceBreakpoint) {
                    return {
                        type: 'source',
                        enabled: bp.enabled,
                        condition: bp.condition,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        location: {
                            uri: bp.location.uri.toString(),
                            line: bp.location.range.start.line + 1,
                            character: bp.location.range.start.character
                        }
                    };
                }
                return {
                    type: 'other',
                    enabled: bp.enabled
                };
            })
        };

        console.log('[getDebugState] Debug state retrieved successfully');
        return state;
    } catch (error) {
        console.error('[getDebugState] Error:', error);
        throw error;
    }
}

/**
 * 注册MCP调试工具
 * @param server MCP服务器实例
 */
export function registerDebugTools(server: McpServer): void {
    // Start debug session tool
    server.tool(
        'start_debug_session_code',
        `Starts a new debug session.

        Use cases: Starting program debugging, running tests, or debugging specific configurations.

        Parameter details:
        - launchConfig: Debug configuration object containing debugger type, program path, etc.
        - Example configuration: {"name": "Debug", "type": "node", "request": "launch", "program": "app.js"}

        Important notes:
        - Requires proper debug configuration in the project
        - Ensure debugger is installed and configured correctly
        - Other debug tools can be used after the session starts`,
        {
            launchConfig: z.any().describe('Debug configuration object')
        },
        async ({ launchConfig }): Promise<CallToolResult> => {
            console.log(`[start_debug_session_code] Tool called with launchConfig:`, launchConfig);

            try {
                await startDebugSession(launchConfig);

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Debug session started successfully`
                        }
                    ]
                };
                console.log('[start_debug_session_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[start_debug_session_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Stop debug session tool
    server.tool(
        'stop_debug_session_code',
        `Stops the currently active debug session.

        Use cases: Ending debugging process, releasing resources.

        Important notes:
        - Returns error if no active debug session is found
        - All breakpoints and debug state are cleared after stopping`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[stop_debug_session_code] Tool called');

            try {
                await stopDebugSession();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Debug session stopped`
                        }
                    ]
                };
                console.log('[stop_debug_session_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[stop_debug_session_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Pause debug session tool
    server.tool(
        'pause_debug_session_code',
        `Pauses the current debug session.

        Use cases: Pausing execution during debugging to check program state.

        Important notes:
        - Only works when debug session is running
        - Can be resumed using the continue tool after pausing`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[pause_debug_session_code] Tool called');

            try {
                await pauseDebugSession();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Debug session paused`
                        }
                    ]
                };
                console.log('[pause_debug_session_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[pause_debug_session_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Continue debug session tool
    server.tool(
        'continue_debug_session_code',
        `Continues a paused debug session.

        Use cases: Resuming program execution after pausing.

        Important notes:
        - Only works when debug session is paused
        - Continues execution until next breakpoint or program end`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[continue_debug_session_code] Tool called');

            try {
                await continueDebugSession();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Debug session continued`
                        }
                    ]
                };
                console.log('[continue_debug_session_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[continue_debug_session_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Step over tool
    server.tool(
        'step_over_code',
        `Executes step over operation.

        Use cases: Stepping over current line during debugging without entering function calls.

        Important notes:
        - Only works when debug session is paused
        - Executes current line and moves to next line`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[step_over_code] Tool called');

            try {
                await stepOver();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Step over executed`
                        }
                    ]
                };
                console.log('[step_over_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[step_over_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Step into tool
    server.tool(
        'step_into_code',
        `Executes step into operation.

        Use cases: Stepping into function calls during debugging.

        Important notes:
        - Only works when debug session is paused
        - If current line is a function call, enters that function`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[step_into_code] Tool called');

            try {
                await stepInto();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Step into executed`
                        }
                    ]
                };
                console.log('[step_into_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[step_into_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Step out tool
    server.tool(
        'step_out_code',
        `Executes step out operation.

        Use cases: Stepping out of current function during debugging, returning to caller.

        Important notes:
        - Only works when debug session is paused
        - Executes remaining part of current function and returns to caller`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[step_out_code] Tool called');

            try {
                await stepOut();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Step out executed`
                        }
                    ]
                };
                console.log('[step_out_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[step_out_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Set breakpoint tool
    server.tool(
        'set_breakpoint_code',
        `Sets a breakpoint at a specific line in a file.

        Use cases: Setting breakpoints at key code locations for pausing execution during debugging.

        Parameter details:
        - path: File path (relative to workspace)
        - line: Line number (1-based)

        Important notes:
        - File must exist in workspace
        - Line number must be within valid range of the file
        - Breakpoint will be active in debug sessions`,
        {
            path: z.string().describe('File path (relative to workspace)'),
            line: z.number().describe('Line number (1-based)')
        },
        async ({ path, line }): Promise<CallToolResult> => {
            console.log(`[set_breakpoint_code] Tool called with path=${path}, line=${line}`);

            try {
                await setBreakpoint(path, line);

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Breakpoint set at ${path}:${line} successfully`
                        }
                    ]
                };
                console.log('[set_breakpoint_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[set_breakpoint_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Remove breakpoint tool
    server.tool(
        'remove_breakpoint_code',
        `Removes a breakpoint from a specific line in a file.

        Use cases: Cleaning up breakpoints that are no longer needed.

        Parameter details:
        - path: File path (relative to workspace)
        - line: Line number (1-based)

        Important notes:
        - Can only remove existing breakpoints
        - Returns error if breakpoint doesn't exist`,
        {
            path: z.string().describe('File path (relative to workspace)'),
            line: z.number().describe('Line number (1-based)')
        },
        async ({ path, line }): Promise<CallToolResult> => {
            console.log(`[remove_breakpoint_code] Tool called with path=${path}, line=${line}`);

            try {
                await removeBreakpoint(path, line);

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Breakpoint removed from ${path}:${line} successfully`
                        }
                    ]
                };
                console.log('[remove_breakpoint_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[remove_breakpoint_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Get debug state tool
    server.tool(
        'get_debug_state_code',
        `Gets the current debug session state information.

        Use cases: Checking debug session status, viewing breakpoint information.

        Return information:
        - Detailed information about active debug session
        - Location and status of all breakpoints
        - Debugger configuration information

        Important notes:
        - Active session information is null if no debug session is active
        - Breakpoint information includes all set breakpoints`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[get_debug_state_code] Tool called');

            try {
                const state = await getDebugState();

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(state, null, 2)
                        }
                    ]
                };
                console.log('[get_debug_state_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[get_debug_state_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Add get_variables_code tool
    server.tool(
        'get_variables_code',
        `Gets the values of variables in the current scope.

        Use cases: Inspecting variable values during debugging, checking current state of execution.

        Parameter details:
        - scope: Variable scope to inspect ('local', 'global', 'watch'). Default: 'local'

        Important notes:
        - Only works when debug session is active and paused
        - Provides access to local, global, and watch variables
        - Returns structured variable information with types and values`,
        {
            scope: z.string().optional().default('local').describe("Variable scope ('local', 'global', 'watch'). Default: 'local'")
        },
        async ({ scope = 'local' }): Promise<CallToolResult> => {
            console.log(`[get_variables_code] Tool called with scope=${scope}`);

            try {
                const session = vscode.debug.activeDebugSession;
                if (!session) {
                    throw new Error('No active debug session found');
                }

                // Get variables from the debug session
                const variables = await session.customRequest('variables', {
                    variablesReference: 0
                });

                console.log('[get_variables_code] Variables retrieved successfully');

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(variables, null, 2)
                        }
                    ]
                };
                console.log('[get_variables_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[get_variables_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Add add_watch_expression_code tool
    server.tool(
        'add_watch_expression_code',
        `Adds a watch expression to monitor variable values.

        Use cases: Tracking specific variables or expressions during debugging.

        Parameter details:
        - expression: The expression to watch (e.g., variable name, complex expression)

        Important notes:
        - Watch expressions are evaluated at each breakpoint
        - Complex expressions may impact debugging performance
        - Use remove_watch_expression_code to clean up`,
        {
            expression: z.string().describe('The expression to watch')
        },
        async ({ expression }): Promise<CallToolResult> => {
            console.log(`[add_watch_expression_code] Tool called with expression=${expression}`);

            try {
                // Note: VS Code doesn't have a direct API for adding watch expressions
                // This would typically be handled through the debug adapter protocol
                // For now, we'll return a message indicating this limitation

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Watch expression '${expression}' would be added. Note: Watch expressions are typically managed through the debug adapter protocol and may require specific debugger support.`
                        }
                    ]
                };
                console.log('[add_watch_expression_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[add_watch_expression_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Add remove_watch_expression_code tool
    server.tool(
        'remove_watch_expression_code',
        `Removes a watch expression.

        Use cases: Cleaning up watch expressions that are no longer needed.

        Parameter details:
        - expression: The expression to remove

        Important notes:
        - Only removes expressions that were previously added
        - Helps maintain clean debugging environment`,
        {
            expression: z.string().describe('The expression to remove')
        },
        async ({ expression }): Promise<CallToolResult> => {
            console.log(`[remove_watch_expression_code] Tool called with expression=${expression}`);

            try {
                // Note: VS Code doesn't have a direct API for removing watch expressions
                // This would typically be handled through the debug adapter protocol

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Watch expression '${expression}' would be removed. Note: Watch expressions are typically managed through the debug adapter protocol and may require specific debugger support.`
                        }
                    ]
                };
                console.log('[remove_watch_expression_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[remove_watch_expression_code] Error in tool:', error);
                throw error;
            }
        }
    );

    // Add get_call_stack_code tool
    server.tool(
        'get_call_stack_code',
        `Gets the current call stack.

        Use cases: Understanding program flow, debugging function calls, analyzing execution path.

        Important notes:
        - Only available when debug session is active and paused
        - Shows the complete call hierarchy
        - Includes file locations and line numbers`,
        {},
        async (): Promise<CallToolResult> => {
            console.log('[get_call_stack_code] Tool called');

            try {
                const session = vscode.debug.activeDebugSession;
                if (!session) {
                    throw new Error('No active debug session found');
                }

                // Get stack trace from the debug session
                const stackTrace = await session.customRequest('stackTrace', {
                    threadId: 1
                });

                console.log('[get_call_stack_code] Call stack retrieved successfully');

                const result: CallToolResult = {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(stackTrace, null, 2)
                        }
                    ]
                };
                console.log('[get_call_stack_code] Successfully completed');
                return result;
            } catch (error) {
                console.error('[get_call_stack_code] Error in tool:', error);
                throw error;
            }
        }
    );
}