import multi from '@rollup/plugin-multi-entry';
import webes from 'rollup-plugin-webes';
import { terser } from "rollup-plugin-terser";

export default [{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/jsm/justright_core_v1.js",
        sourcemap: "inline",
        format: "es"
    },
    plugins: [
        multi(),
		webes({
            'coreutil_v1': './coreutil_v1.js',
            'xmlparser_v1': './xmlparser_v1.js',
            'mindi_v1': './mindi_v1.js',
            'containerbridge_v1': './containerbridge_v1.js',
            replaceStage: 'renderChunk'
        })
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/jsm/justright_core_v1.min.js",
        format: "es"
    },
    plugins: [
        multi(),
        webes({
            'coreutil_v1': './coreutil_v1.js',
            'xmlparser_v1': './xmlparser_v1.js',
            'mindi_v1': './mindi_v1.js',
            'containerbridge_v1': './containerbridge_v1.js',
            replaceStage: 'renderChunk'
        }),
        terser()
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/cjs/justright_core_v1.js",
        sourcemap: "inline",
        format: "cjs"
    },
    plugins: [
        multi()
    ]
}];