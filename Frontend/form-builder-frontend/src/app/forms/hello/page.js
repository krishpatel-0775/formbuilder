"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HelloWorldPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-8 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="inline-block mb-6"
        >
          <div className="bg-white/40 p-4 rounded-2xl">
            <span className="text-6xl">👋</span>
          </div>
        </motion.div>

        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
          Hello World
        </h1>
        
        <p className="text-lg text-white/80 leading-relaxed mb-8">
          Welcome to your new premium interface. This page is a showcase of 
          modern design principles and smooth animations.
        </p>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 px-6 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl transition-all duration-300"
          onClick={() => window.history.back()}
        >
          Go Back
        </motion.button>

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
              className="w-2 h-2 bg-white rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
