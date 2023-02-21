import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../resources/routes-constants'

const NotFoundPage: React.FC = () => {

    return (
        <>
            <h1>Oops 404!</h1>
            <Link to={ROUTES.OVERVIEW_ROUTE}>
                Back to homepage
            </Link>
        </>
    )
}

export default NotFoundPage