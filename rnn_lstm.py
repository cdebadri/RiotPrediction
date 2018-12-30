#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Aug 23 09:14:13 2018

@author: gogol
"""

from keras.models import load_model
from keras.preprocessing.text import Tokenizer
from keras.preprocessing.sequence import pad_sequences
import numpy as np
import re
import argparse
import sys

#MAX_NO_WORDS = 20000
#MAX_SEQUENCE_LENGTH = 1000

def analyseSentiment(sentences):
    model = load_model('model.h5')
    
    for i in range(len(sentences)):
        sentences[i] = sentences[i].lower()
        sentences[i] = re.sub('[^a-zA-z0-9\s]','', sentences[i])

    max_features = 2000
    tokenizer = Tokenizer(num_words=max_features, split=' ')
    tokenizer.fit_on_texts(sentences)
    X = tokenizer.texts_to_sequences(sentences)
    X = pad_sequences(X, maxlen=86, dtype='int32', value=0)
    results = model.predict_classes(X, batch_size=len(sentences), verbose=0)
    # print(results)
    # sys.stdout.flush()
    return results

# parser = argparse.ArgumentParser()
# parser.add_argument('--texts', nargs='*', type=str)
# args = parser.parse_args()
# analyse(args.texts)

def analyseToxicity(sentences):
    
    for i in range(len(sentences)):
        sentences[i] = sentences[i].lower()
        sentences[i] = re.sub('[^a-zA-z0-9\s]','', sentences[i])

    max_features = 20000
    tokenizer = Tokenizer(num_words=max_features, split=' ')
    tokenizer.fit_on_texts(sentences)
    X = tokenizer.texts_to_sequences(sentences)
    X = pad_sequences(X, maxlen=200, dtype='int32', value=0)

    model = load_model('toxicity.h5')
    results = model.predict(X, batch_size=len(sentences), verbose=0)

    probs = np.amax(results, axis=1)
    results = np.argmax(results, axis=1)
    for i in range(len(results)):
        if probs[i] < 0.5:
            results[i] = 6 

    return results

# sents = ['fucking shit, fucking life', 'nigga i want to kill you and eat your cunt', 'good boy']
# print(analyseToxicity(sents))