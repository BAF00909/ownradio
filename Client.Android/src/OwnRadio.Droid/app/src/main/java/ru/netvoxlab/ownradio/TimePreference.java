package ru.netvoxlab.ownradio;

import android.content.Context;
import android.content.res.TypedArray;
import android.preference.DialogPreference;
import android.util.AttributeSet;
import android.view.View;
import android.widget.TimePicker;

public class TimePreference extends DialogPreference {
	private int lastHour=0;
	private int lastMinute=0;
	private TimePicker picker=null;
	
	public static int getHour(String time) {
		String[] pieces=time.split(":");
		
		return(Integer.parseInt(pieces[0]));
	}
	
	public static int getMinute(String time) {
		String[] pieces=time.split(":");
		
		return(Integer.parseInt(pieces[1]));
	}
	
	public TimePreference(Context ctxt, AttributeSet attrs) {
		super(ctxt, attrs);
		
		setPositiveButtonText(R.string.button_ok);
		setNegativeButtonText(R.string.button_cancel);
	}
	
	@Override
	protected View onCreateDialogView() {
		picker=new TimePicker(getContext());
		picker.setIs24HourView(true);
		return(picker);
	}
	
	@Override
	protected void onBindDialogView(View v) {
		super.onBindDialogView(v);
		
		picker.setCurrentHour(lastHour);
		picker.setCurrentMinute(lastMinute);
	}
	
	@Override
	protected void onDialogClosed(boolean positiveResult) {
		super.onDialogClosed(positiveResult);
		
		if (positiveResult) {
			lastHour=picker.getCurrentHour();
			lastMinute=picker.getCurrentMinute();
			
			String time=String.valueOf(lastHour)+":"+String.valueOf(lastMinute);
			
			if (callChangeListener(time)) {
				persistString(time);
			}
			this.notifyChanged();
		}
	}
	
	@Override
	protected Object onGetDefaultValue(TypedArray a, int index) {
		return(a.getString(index));
	}
	
	@Override
	protected void onSetInitialValue(boolean restoreValue, Object defaultValue) {
		String time=null;
		
		if (restoreValue) {
			if (defaultValue==null) {
				time=getPersistedString("00:00");
			}
			else {
				time=getPersistedString(defaultValue.toString());
			}
		}
		else {
			time=defaultValue.toString();
		}
		
		lastHour=getHour(time);
		lastMinute=getMinute(time);
	}
	
	@Override
	public CharSequence getSummary() {
		if(String.valueOf(lastMinute).length()==2)
			return (lastHour == 0) ? null : lastHour + ":" + lastMinute;
		else
			return (lastHour == 0) ? null : lastHour + ":0" + lastMinute;
	}
}
