import React, { useMemo } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { Physics, usePlane, useBox } from 'use-cannon'

export default function Cube({ number=5 }) {
    const [ref, api] = useBox(() => ({
      mass: 1,
      args: [0.1, 0.1, 0.1],
      position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5]
    }))
  
    useFrame(() => api.at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
  
    return (
      <h1></h1>
    )
  }