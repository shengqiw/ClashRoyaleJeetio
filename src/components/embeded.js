import React from 'react'

export const YT = (url) => (
    <iframe title={url} width="100%" height="400px" src={url} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
)
