from typing import Dict, Optional


def calcular_bmr_mifflin(peso: float, altura: int, edad: int, genero: str) -> float:
    """
    Calcula la Tasa Metabólica Basal (BMR) usando la ecuación de Mifflin-St Jeor.
    Peso en kg, Altura en cm, Edad en años.
    """
    if not peso or not altura or not edad:
        return 0.0
        
    bmr = (10 * peso) + (6.25 * altura) - (5 * edad)
    
    if genero == "M":
        bmr += 5
    elif genero == "F":
        bmr -= 161
    else:
        # Si no especifica, promedio
        bmr -= 78
        
    return bmr


FACTORES_ACTIVIDAD = {
    "sedentario": 1.2,      # Poco o ningún ejercicio
    "ligero": 1.375,        # Ejercicio ligero 1-3 días/semana
    "moderado": 1.55,       # Ejercicio moderado 3-5 días/semana
    "activo": 1.725,        # Ejercicio fuerte 6-7 días/semana
    "muy_activo": 1.9       # Ejercicio muy fuerte o trabajo físico
}


def calcular_tdee(bmr: float, actividad: str) -> float:
    """Calcula el Gasto Energético Total Diario (TDEE)"""
    factor = FACTORES_ACTIVIDAD.get(actividad, 1.2)
    return bmr * factor


def calcular_objetivos(
    peso: float, 
    altura: int, 
    edad: int, 
    genero: str, 
    actividad: str
) -> Dict[str, int]:
    """
    Retorna un diccionario con las calorías sugeridas para diferentes objetivos.
    """
    if not all([peso, altura, edad]):
        return {
            "mantenimiento": 2000,
            "deficit": 1600,
            "volumen": 2300
        }
    
    bmr = calcular_bmr_mifflin(peso, altura, edad, genero)
    tdee = calcular_tdee(bmr, actividad)
    
    # Redondeamos a múltiplos de 50 para que sean números "bonitos"
    def redondear(valor):
        return int(round(valor / 50.0) * 50)
    
    return {
        "bmr": int(bmr),
        "tdee": int(tdee),
        "mantenimiento": redondear(tdee),
        "deficit": redondear(tdee * 0.85),  # -15%
        "volumen": redondear(tdee * 1.10)   # +10%
    }
