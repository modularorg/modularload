import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default [{
    input: 'src/main.js',
    output: [
        {
            file: 'dist/main.cjs.js',
            format: 'cjs'
        },
        {
            file: 'dist/main.esm.js',
            format: 'esm'
        }
    ],
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}];
