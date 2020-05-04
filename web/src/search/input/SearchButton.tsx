import SearchIcon from 'mdi-react/SearchIcon'
import React from 'react'
import { SearchHelpDropdownButton } from './SearchHelpDropdownButton'
import classNames from 'classnames'

interface Props {
    /** Hide the "help" icon and dropdown. */
    noHelp?: boolean
    className?: string
}

/**
 * A search button with a dropdown with related links. It must be wrapped in a form whose onSubmit
 * handler performs the search.
 */
export const SearchButton: React.FunctionComponent<Props> = ({ noHelp, className }) => (
    <div className="search-button d-flex">
        <button
            className={classNames('btn btn-primary search-button__btn e2e-search-button', className)}
            type="submit"
            aria-label="Search"
        >
            <SearchIcon className="icon-inline" aria-hidden="true" />
        </button>
        {!noHelp && <SearchHelpDropdownButton />}
    </div>
)
