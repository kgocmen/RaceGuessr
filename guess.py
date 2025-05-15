from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np
import settings
from sentence_transformers import SentenceTransformer

def get_suggestions(guess, df):
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    guess_emb = model.encode([guess])
    pop_names = df.index.tolist()
    name_embs = model.encode(pop_names)
    sim_scores = cosine_similarity(guess_emb, name_embs)[0]
    top_idx = np.argsort(sim_scores)[-settings.TOP_K:][::-1]
    return pd.DataFrame({
        "Population": [pop_names[i] for i in top_idx],
        "Similarity": sim_scores[top_idx]
    })

def force_input(prompt, suggestions):
    print(settings.TEXTS["mean"])
    while True:
        for i, row in suggestions.iterrows():
            print(f"{i + 1}) {row['Population']} (sim: {row['Similarity']:.2f})")

        while True:
            try:
                choice = int(input(prompt))
                if choice == 0:
                    return choice
                elif 1 <= choice <= len(suggestions):
                    return suggestions.iloc[choice - 1]["Population"]
                
            except:
                pass
            print(settings.TEXTS["inv_guess"])



def check_guess(guess, df):
    if guess in df.index:
        return guess
    
    suggestions = get_suggestions(guess, df)
    if suggestions.head(1)["Similarity"].values[0] > settings.THRESHOLD:
        return suggestions.head(1)["Population"].values[0]

    return force_input(settings.TEXTS["prompt"], suggestions)