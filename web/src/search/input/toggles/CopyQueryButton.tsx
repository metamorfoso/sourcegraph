import copy from 'copy-to-clipboard'
import ContentCopyIcon from 'mdi-react/ContentCopyIcon'
import { Tooltip } from '../../../components/tooltip/Tooltip'
import React, { useCallback } from 'react'
import classNames from 'classnames'
import { Observable, merge, of } from 'rxjs'
import { tap, switchMapTo, startWith, delay } from 'rxjs/operators'
import { useEventObservable } from '../../../../../shared/src/util/useObservable'
import { FiltersToTypeAndValue } from '../../../../../shared/src/search/interactive/util'
import { PatternTypeProps, CaseSensitivityProps } from '../..'
import { generateFiltersQuery } from '../../../../../shared/src/util/url'
import { isEmpty } from 'lodash'

interface Props extends Pick<PatternTypeProps, 'patternType'>, Pick<CaseSensitivityProps, 'caseSensitive'> {
    navbarQuery: string
    filtersInQuery?: FiltersToTypeAndValue
    className?: string
}

/**
 * A repository header action that copies the current page's URL to the clipboard.
 */
export const CopyQueryButton: React.FunctionComponent<Props> = (props: Props) => {
    const fullQuery = [
        props.navbarQuery,
        props.filtersInQuery && generateFiltersQuery(props.filtersInQuery),
        `patternType:${props.patternType}`,
        props.caseSensitive ? 'case:yes' : '',
    ]
        .filter(queryPart => !!queryPart)
        .join(' ')

    const [nextClick, copied] = useEventObservable(
        useCallback(
            (clicks: Observable<React.MouseEvent>) =>
                clicks.pipe(
                    tap(() => copy(fullQuery)),
                    switchMapTo(merge(of(true), of(false).pipe(delay(1000)))),
                    tap(() => Tooltip.forceUpdate()),
                    startWith(false)
                ),
            [fullQuery]
        )
    )

    return (
        <div className="d-flex">
            <button
                type="button"
                className={classNames('btn btn-secondary rounded-0', props.className)}
                data-tooltip={copied ? 'Copied!' : 'Copy query to clipboard'}
                onClick={nextClick}
                disabled={
                    props.filtersInQuery
                        ? isEmpty(props.filtersInQuery) && props.navbarQuery.length === 0
                        : props.navbarQuery.length === 0
                }
            >
                <ContentCopyIcon className="icon-inline" />
            </button>
        </div>
    )
}
