// @flow

export function setVSplit(size: number) {
    return {
        type: 'SET_V_SPLIT',
        size,
    };
}

export function setHSplit(size: number) {
    return {
        type: 'SET_H_SPLIT',
        size,
    };
}
