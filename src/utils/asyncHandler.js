const asyncHandler = ( reqHandler ) => {
    return ( req, res, next ) => {
        Promise.resolve( reqHandler( req, res, next ) )
        .catch( ( err ) => next( err ) )
    }
}

export { asyncHandler }

/*  we can write also **/

// const asyncHandler = ( fn ) => async ( req, res, next ) => {
//     try {
//         await fn( req, res, next )
//     } catch ( err ) {
//         res.satus( err.code || 500 ).json({
//             success: truwe,
//             message: err.message
//         })
//     }
// }
