import { applyEdits } from '@sqs/jsonc-parser'
import { createTwoFilesPatch, Hunk, structuredPatch } from 'diff'
import { CodeAction, TextEdit } from 'sourcegraph'
import { positionToOffset } from '../../../../../../shared/src/api/client/types/textDocument'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { propertyIsDefined } from '../../../../../../shared/src/util/types'
import { parseRepoURI } from '../../../../../../shared/src/util/url'

export interface FileDiff extends Pick<GQL.IFileDiff, 'oldPath' | 'newPath'> {
    hunks: GQL.IFileDiffHunk[]
    patch: string
}

export const npmDiffToFileDiffHunk = (hunk: Hunk): GQL.IFileDiffHunk => ({
    __typename: 'FileDiffHunk',
    body: hunk.lines.join('\n'),
    oldRange: { __typename: 'FileDiffHunkRange', startLine: hunk.oldStart, lines: hunk.oldLines },
    newRange: { __typename: 'FileDiffHunkRange', startLine: hunk.newStart, lines: hunk.newLines },
    oldNoNewlineAt: false,
    section: null,
})

/**
 * Computes the combined diff from applying all active code actions' workspace edits.
 */
export async function computeDiff(
    { services: { fileSystem } }: ExtensionsControllerProps['extensionsController'],
    codeActions: Pick<CodeAction, 'edit'>[]
): Promise<FileDiff[]> {
    // TODO!(sqs): handle conflicting edits
    const editsByUri = new Map<string, TextEdit[]>()
    for (const { edit } of codeActions.filter(propertyIsDefined('edit'))) {
        for (const [uri, edits] of edit.textEdits()) {
            const existingEdits = editsByUri.get(uri.toString()) || []
            editsByUri.set(uri.toString(), [...existingEdits, ...edits])
        }
    }

    const fileDiffs: FileDiff[] = []
    for (const [uri, edits] of editsByUri) {
        const oldText = await fileSystem.readFile(new URL(uri))
        const newText = applyEdits(
            oldText,
            edits.map(edit => {
                // TODO!(sqs): doesnt account for multiple edits
                const startOffset = positionToOffset(oldText, edit.range.start)
                const endOffset = positionToOffset(oldText, edit.range.end)
                return { offset: startOffset, length: endOffset - startOffset, content: edit.newText }
            })
        )
        const { hunks } = structuredPatch(uri.toString(), uri.toString(), oldText, newText, undefined, undefined, {
            context: 4,
        })
        const p = parseRepoURI(uri)
        fileDiffs.push({
            oldPath: uri.toString(),
            newPath: uri.toString(),
            hunks: hunks.map(npmDiffToFileDiffHunk),
            patch: createTwoFilesPatch('a/' + p.filePath!, 'b/' + p.filePath!, oldText, newText, undefined, undefined),
        })
    }
    return fileDiffs
}